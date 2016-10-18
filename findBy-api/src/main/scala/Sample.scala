import akka.actor.{Actor, ActorRef}
import akka.http.scaladsl.model.{ContentType, HttpEntity, HttpResponse, MediaTypes}
import akka.http.scaladsl.server.Directives
import akka.pattern.ask
import org.json4s.DefaultFormats
import slick.driver.PostgresDriver.api._
import slick.lifted.TableQuery

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.concurrent.duration._
import JsonImplicits._
/**
  * Created by DDM on 08-10-2016.
  */
class SampleRest(router: ActorRef)(controller: SampleController) extends Directives {

  val route = path("dm") {
    get {
      getSampleData
    }
  }
  val route1 = path("rama") {
    get {
      getSampleData
    }
  } ~ path("hari") {
    get {
      getSampleData
    }
  } ~ pathPrefix("baba") {
    get {
      getSampleData
    }
  } ~ pathPrefix("sana") {
    path(LongNumber) { id => {
      getSampleData
    }
    }
  }

  def getSampleData = {
    complete {
      controller.getDataFromDb(router).flatMap(s => {
        s.map(t => {
          HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
        })
      })
    }
  }
}

class SampleController {
  def getDataFromDb(ref: ActorRef): Future[Future[Seq[Hotel]]] = {
    ask(ref, SampleCommand)(5.seconds).mapTo[Future[Seq[Hotel]]]
  }
}

class SampleActor extends Actor {
  override def receive: Receive = {
    case SampleCommand => sender ! SampleRepository.getData
  }
}

object SampleRepository {
  def getData: Future[Seq[Hotel]] = {
    val hotels = ImplHotelRepository.getAll
    hotels
  }
}

case object SampleCommand

case class SampleClass(id: Long, name: String)

case class Hotel(override val id: Long, hotel: String, override val isDeleted: Boolean) extends BaseEntity

class HotelTable(_tableTag: Tag) extends BaseTable[Hotel](_tableTag, Some("public"), "Hotel") {
  def * = (id, hotel, isDeleted) <>(Hotel.tupled, Hotel.unapply)

  def ? = (Rep.Some(id), Rep.Some(hotel), Rep.Some(isDeleted)).shaped.<>({ r => import r._; _1.map(_ => Hotel.tupled((_1.get, _2.get, _3.get))) }, (_: Any) => throw new Exception("Inserting into ? projection not supported."))

  override val id: Rep[Long] = column[Long]("HotelId", O.PrimaryKey)
  val hotel: Rep[String] = column[String]("Hotel")
  override val isDeleted: Rep[Boolean] = column[Boolean]("IsRemoved")
}

object Tables {
  lazy val hotelTable = new TableQuery(tag => new HotelTable(tag))
}

abstract class HotelRepository extends BaseRepository[HotelTable, Hotel](TableQuery[HotelTable])

object ImplHotelRepository extends HotelRepository

