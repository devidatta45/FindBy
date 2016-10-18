import akka.actor.{Actor, ActorRef}
import akka.http.scaladsl.model.{ContentType, HttpEntity, HttpResponse, MediaTypes}
import akka.http.scaladsl.server.Directives
import slick.lifted.{Rep, Tag}
import slick.driver.PostgresDriver.api._
import akka.pattern.ask

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * Created by DDM on 13-10-2016.
  */
case class ActivityType(override val id: Long, name: String, description: String, override val isDeleted: Boolean) extends BaseEntity

case class Activity(override val id: Long, activityTypeId: Long,
                    latitude: Double, longitude: Double, override val isDeleted: Boolean) extends BaseEntity

class ActivityTypeTable(_tableTag: Tag) extends BaseTable[ActivityType](_tableTag, Some("public"), "ActivityType") {
  def * = (id, name, description, isDeleted) <>(ActivityType.tupled, ActivityType.unapply)

  def ? = (Rep.Some(id), Rep.Some(name), Rep.Some(description), Rep.Some(isDeleted))
    .shaped.<>({ r => import r._; _1.map(_ => ActivityType.tupled((_1.get, _2.get, _3.get, _4.get))) }, (_: Any) => throw new Exception("Inserting into ? projection not supported."))

  override val id: Rep[Long] = column[Long]("ActivityTypeId", O.PrimaryKey, O.AutoInc)
  val name: Rep[String] = column[String]("Name")
  val description: Rep[String] = column[String]("Description")
  override val isDeleted: Rep[Boolean] = column[Boolean]("IsDeleted")
}

class ActivityTable(_tableTag: Tag) extends BaseTable[Activity](_tableTag, Some("public"), "Activity") {
  def * = (id, activityTypeId, latitude, longitude, isDeleted) <>(Activity.tupled, Activity.unapply)

  def ? = (Rep.Some(id), Rep.Some(activityTypeId), Rep.Some(latitude), Rep.Some(longitude), Rep.Some(isDeleted))
    .shaped.<>({ r => import r._; _1.map(_ => Activity.tupled((_1.get, _2.get, _3.get, _4.get, _5.get))) }, (_: Any) => throw new Exception("Inserting into ? projection not supported."))

  override val id: Rep[Long] = column[Long]("ActivityId", O.PrimaryKey, O.AutoInc)
  val activityTypeId: Rep[Long] = column[Long]("ActivityTypeId")
  val latitude: Rep[Double] = column[Double]("Latitude")
  val longitude: Rep[Double] = column[Double]("Longitude")
  override val isDeleted: Rep[Boolean] = column[Boolean]("IsDeleted")
}

abstract class ActivityTypeRepository extends BaseRepository[ActivityTypeTable, ActivityType](TableQuery[ActivityTypeTable])

object ImplActivityTypeRepository extends ActivityTypeRepository

class ActivityTypeActor extends Actor {
  override def receive: Receive = {
    case cmd: GetAllCommand => {
      sender ! getAllActivities(cmd)
    }
  }

  def getAllActivities(cmd: GetAllCommand): Future[Seq[ActivityType]] = {
    for {
      token <- ImplTokenRepository.getAllTrue
      filteredValue = token.find(s => s.token == cmd.apiKey)
      result <- if (filteredValue.isDefined) {
        ImplActivityTypeRepository.getAll
      } else {
        throw new Exception("session expired")
      }
    } yield result
  }
}

trait IActivityTypeController {
  def getAllActivityTypes(ref: ActorRef, apiKey: String): Future[Future[Seq[ActivityType]]]
}

object ActivityTypeController extends IActivityTypeController {
  override def getAllActivityTypes(ref: ActorRef, apiKey: String): Future[Future[Seq[ActivityType]]] = {
    ask(ref, GetAllCommand(apiKey))(5.second).mapTo[Future[Seq[ActivityType]]]
  }
}

class ActivityTypeRest(controller: IActivityTypeController)(ref: ActorRef) extends Directives {
  val routes = path("activityTypes") {
    get {
      getAllActivityTypes
    }
  }

  def getAllActivityTypes = {
    headerValueByName("apiKey") { apiKey =>
      complete({
        controller.getAllActivityTypes(ref, apiKey).flatMap(s => {
          s.map(t => {
            HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
          })
        })
      })
    }
  }
}

case class GetAllCommand(apiKey: String)