import akka.actor.{Actor, ActorRef, ActorSystem, Props}
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.{Directives, Route, RouteConcatenation}
import akka.pattern.ask
import akka.routing.RoundRobinPool
import akka.stream.ActorMaterializer
import org.json4s.{DefaultFormats, Extraction, Formats}
import org.json4s.jackson.JsonMethods._

import scala.concurrent.Await
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._

/**
  * Created by devidatta on 9/22/2016.
  */


trait StartHelper extends RouteConcatenation with CORSSupport {
  implicit val actorSystem = Helper.actorSystem
  implicit val acf = ActorMaterializer()
  val routes: Route

  def startServer = {
    val binding = Http().bindAndHandle(cors(routes), interface = "localhost", port = 9292)
    binding.map(s => {
      println("connected to " + s.localAddress)
    })
  }
}

object Helper {
  val actorSystem = ActorSystem("SampleTest")
}

trait ActorCreator {

  val ref = Helper.actorSystem.actorOf(Props[ActorSupervisor])

  def createRouter(props: Props, name: String): ActorRef = {
    val future = ask(ref, ActorName(props, name))(2.second).mapTo[ActorRef]
    Await.result(future, 2.second)
  }

  def callFromOthers(props: Props, name: String): ActorRef = {
    createRouter(RoundRobinPool(1).props(props), name)
  }
}

class ActorSupervisor extends Actor {
  override def receive: Receive = {
    case cmd: ActorName => sender ! context.actorOf(cmd.props, cmd.name)
  }
}

class RestService extends StartHelper with LazyActor {
  override val routes: Route = new SampleRest(actor1)(new SampleController).route ~
    new SampleRest(actor1)(new SampleController).route1 ~
    new UserAccountRest(UserAccountController)(userAccountActor).route ~
    new TokenRest(TokenController)(tokenActor).routes ~
    new ActivityTypeRest(ActivityTypeController)(activityTypeActor).routes
  override val contextRoot: String = "drum"
}

trait LazyActor extends ActorCreator {
  val actor1 = callFromOthers(Props[SampleActor], "SampleActor")
  val userAccountActor = callFromOthers(Props[UserAccountActor], "UserAccountActor")
  val tokenActor = callFromOthers(Props[TokenActor], "TokenActor")
  val activityTypeActor = callFromOthers(Props[ActivityTypeActor], "ActivityTypeActor")
}

object Boot extends RestService with App {
  startServer
}

case class ActorName(props: Props, name: String)

trait CORSSupport extends Directives {
  val contextRoot: String
  val corsHeaders = List(RawHeader("Access-Control-Allow-Origin", "*"),
    RawHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS, DELETE"),
    RawHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Accept-Encoding, Accept-Language, Host, Referer, User-Agent,apiKey,referenceKey"))

  def cors(routes: => Route) = {
    respondWithHeaders(corsHeaders) {
      pathPrefix(contextRoot) {
        routes ~ options {
          complete(StatusCodes.OK)
        }
      }
    }
  }
}

object Df extends App {
  val dd = "aabcccdee"
  var result = ""
  val list = dd.toList
  list.zipWithIndex.foreach(x => {
    if (x._2 < list.size-1) {
      if (list(x._2) == list(x._2 + 1) || list(x._2) == list(x._2 - 1)) {

      }
      else{
        result=result+x._1
      }
    }
  })
  println(result)
}

object JsonImplicits {
  def toJson(value: Any): String = {
    if (value.isInstanceOf[String]) value.asInstanceOf[String] else convertToJValue(value)
  }

  implicit val format = DefaultFormats

  def convertToJValue(x: Any) = compact(Extraction.decompose(x))

  def extractEntity[A](json: String)(implicit formats: Formats, mf: Manifest[A]): A = parse(json).extract[A]
}