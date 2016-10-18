import java.util.UUID

import akka.actor.{Actor, ActorRef}
import akka.http.scaladsl.model.{ContentType, HttpEntity, HttpResponse, MediaTypes}
import akka.http.scaladsl.server.Directives
import slick.driver.PostgresDriver.api._
import akka.pattern.ask
import JsonImplicits._
import scala.concurrent.duration._
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

abstract class TokenRepository extends BaseRepository[TokenTable, Token](TableQuery[TokenTable])

object ImplTokenRepository extends TokenRepository

case class Token(override val id: Long, userAccountId: Long, token: String, override val isDeleted: Boolean) extends BaseEntity

class TokenTable(_tableTag: Tag) extends BaseTable[Token](_tableTag, Some("public"), "Token") {
  def * = (id, userAccountId, token, isDeleted) <>(Token.tupled, Token.unapply)

  def ? = (Rep.Some(id), Rep.Some(userAccountId), Rep.Some(token), Rep.Some(isDeleted))
    .shaped.<>({ r => import r._; _1.map(_ => Token.tupled((_1.get, _2.get, _3.get, _4.get))) }, (_: Any) => throw new Exception("Inserting into ? projection not supported."))

  override val id: Rep[Long] = column[Long]("TokenId", O.PrimaryKey, O.AutoInc)
  val userAccountId: Rep[Long] = column[Long]("UserAccountId")
  val token: Rep[String] = column[String]("Token")
  override val isDeleted: Rep[Boolean] = column[Boolean]("IsRunning")
}

class TokenActor extends Actor {

  def loginUser(cmd: LoginCommand): Future[TokenWithCount] = {
    for {
      userAccounts <- ImplUserAccountRepository.getAll
      tokens <- ImplTokenRepository.getAll
      filteredUser = userAccounts.find(u => u.userName == cmd.userName && u.password == cmd.password)
      res <- if (filteredUser.isDefined) {
        val token = UUID.randomUUID().toString
        val userToken = Token(0, filteredUser.get.id, token, true)
        ImplTokenRepository.save(userToken)
      } else {
        throw new Exception("user Account does not exist")
      }
      count <- if (filteredUser.isDefined) {
        ImplTokenRepository.filter(s => s.userAccountId === filteredUser.get.id)
      } else {
        throw new Exception("user Account does not exist")
      }
      size = count.size
    } yield TokenWithCount(res, size)
  }

  def logoutUser(id: Long): Future[Int] = {
    for {
      tokens <- ImplTokenRepository.getAllTrue
      filteredToken = tokens.find(s => s.userAccountId == id)
      updatedToken = filteredToken.get.copy(isDeleted = false)
      update <- ImplTokenRepository.updateByIdWithout(filteredToken.get.id, updatedToken)
    } yield update
  }

  override def receive: Receive = {
    case SampleCommand => sender ! ImplTokenRepository.getAll
    case cmd: LoginCommand => sender ! loginUser(cmd)
    case id: Long => sender ! logoutUser(id)
  }
}

trait ITokenController {
  def getAllTokens(ref: ActorRef): Future[Future[Seq[Token]]]

  def loginUser(jsonData: String, ref: ActorRef): Future[Future[TokenWithCount]]

  def logoutUser(ref: ActorRef, id: Long): Future[Future[Int]]
}

object TokenController extends ITokenController {
  override def getAllTokens(ref: ActorRef): Future[Future[Seq[Token]]] = {
    ask(ref, SampleCommand)(5.seconds).mapTo[Future[Seq[Token]]]
  }

  override def loginUser(jsonData: String, ref: ActorRef): Future[Future[TokenWithCount]] = {
    val loginData = JsonImplicits.extractEntity[LoginCommand](jsonData)
    ask(ref, loginData)(5.seconds).mapTo[Future[TokenWithCount]]
  }

  override def logoutUser(ref: ActorRef, id: Long): Future[Future[Int]] = {
    ask(ref, id)(5.seconds).mapTo[Future[Int]]
  }
}

class TokenRest(controller: ITokenController)(ref: ActorRef) extends Directives {
  val routes = path("tokens") {
    get {
      getAllTokens
    }
  } ~ pathPrefix("login") {
    post {
      loginUser
    }
  } ~ pathPrefix("logout") {
    path(LongNumber) { id => {
      get {
        logoutUser(id)
      }
    }
    }
  }

  def getAllTokens = {
    headerValueByName("apiKey") { apiKey =>
      complete({
        println(apiKey)
        controller.getAllTokens(ref).flatMap(s => {
          s.map(t => {
            HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
          })
        })
      })
    }
  }

  def loginUser = {
    entity(as[String]) {
      jsonData => {
        complete {
          controller.loginUser(jsonData, ref).flatMap(s => {
            s.map(t => {
              HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
            })
          })
        }
      }
    }
  }

  def logoutUser(id: Long) = {
    complete({
      controller.logoutUser(ref, id).flatMap(s => {
        s.map(t => {
          HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
        })
      })
    })
  }
}

case class LoginCommand(userName: String, password: String)

case class TokenWithCount(command: Token, count: Int)
