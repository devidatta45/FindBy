/**
  * Created by DDM on 10-06-2016.
  */

import java.sql.Timestamp
import java.util.UUID

import JsonImplicits._
import akka.actor.{Actor, ActorRef}
import akka.http.scaladsl.model.{ContentType, HttpEntity, HttpResponse, MediaTypes}
import akka.http.scaladsl.server.Directives
import akka.pattern.ask
import slick.driver.PostgresDriver.api._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.concurrent.duration._


abstract class UserAccountRepository extends BaseRepository[UserAccountTable, UserAccount](TableQuery[UserAccountTable])

object ImplUserAccountRepository extends UserAccountRepository

case class UserAccount(override val id: Long, firstName: String, lastName: String, userName: String,
                       password: String, email: String, dob: Timestamp, override val isDeleted: Boolean) extends BaseEntity

class UserAccountTable(_tableTag: Tag) extends BaseTable[UserAccount](_tableTag, Some("public"), "UserAccount") {
  def * = (id, firstName, lastName, userName, password, email, dob, isDeleted) <>(UserAccount.tupled, UserAccount.unapply)

  def ? = (Rep.Some(id), Rep.Some(firstName), Rep.Some(lastName), Rep.Some(userName), Rep.Some(password), Rep.Some(email), Rep.Some(dob),
    Rep.Some(isDeleted))
    .shaped.<>({ r => import r._; _1.map(_ => UserAccount.tupled((_1.get, _2.get, _3.get, _4.get, _5.get, _6.get, _7.get, _8.get))) },
    (_: Any) => throw new Exception("Inserting into ? projection not supported."))

  override val id: Rep[Long] = column[Long]("UserAccountId", O.PrimaryKey, O.AutoInc)
  val firstName: Rep[String] = column[String]("FirstName")
  val lastName: Rep[String] = column[String]("LastName")
  val userName: Rep[String] = column[String]("UserName")
  val password: Rep[String] = column[String]("Password")
  val email: Rep[String] = column[String]("Email")
  val dob: Rep[Timestamp] = column[Timestamp]("DOB")
  override val isDeleted: Rep[Boolean] = column[Boolean]("IsDeleted")
}

class UserAccountActor extends Actor {

  def updateUserDetails(cmd: UserAccountWithApiKey): Future[Int] = {
    for {
      token <- ImplTokenRepository.getAllTrue
      filteredValue = token.find(s => s.token == cmd.apiKey)
      result <- if (filteredValue.isDefined) {
        ImplUserAccountRepository.updateById(filteredValue.get.userAccountId, cmd.user)
      } else {
        throw new Exception("session expired")
      }
    } yield result
  }

  override def receive: Receive = {
    case SampleCommand => sender ! ImplUserAccountRepository.getAll
    case cmd: UserAccount => sender ! ImplUserAccountRepository.save(cmd)
    case id: Long => sender ! ImplUserAccountRepository.getById(id)
    case cmd: UserAccountWithApiKey => sender ! updateUserDetails(cmd)
  }
}

trait IUserAccountController {
  def getAllUserAccount(ref: ActorRef): Future[Future[Seq[UserAccount]]]

  def addUserAccount(ref: ActorRef, jsonData: String): Future[Future[UserAccount]]

  def getUserAccountById(ref: ActorRef, id: Long): Future[Future[Option[UserAccount]]]

  def updateUserDetails(apiKey: String, jsonData: String, ref: ActorRef): Future[Future[Int]]
}

object UserAccountController extends IUserAccountController {
  override def getAllUserAccount(ref: ActorRef): Future[Future[Seq[UserAccount]]] = {
    ask(ref, SampleCommand)(5.seconds).mapTo[Future[Seq[UserAccount]]]
  }

  override def addUserAccount(ref: ActorRef, jsonData: String): Future[Future[UserAccount]] = {
    val data = JsonImplicits.extractEntity[UserAccount](jsonData)
    val password = UUID.randomUUID().toString
    val changedData = data.copy(password = password)
    ask(ref, changedData)(5.seconds).mapTo[Future[UserAccount]]
  }

  override def getUserAccountById(ref: ActorRef, id: Long): Future[Future[Option[UserAccount]]] = {
    ask(ref, id)(5.seconds).mapTo[Future[Option[UserAccount]]]
  }

  override def updateUserDetails(apiKey: String, jsonData: String, ref: ActorRef): Future[Future[Int]] = {
    val data = JsonImplicits.extractEntity[UserAccount](jsonData)
    val userData = UserAccountWithApiKey(data, apiKey)
    ask(ref, userData)(5.seconds).mapTo[Future[Int]]
  }
}

class UserAccountRest(controller: IUserAccountController)(ref: ActorRef) extends Directives {
  val route = path("userAccounts") {
    get {
      getUserAccount
    } ~ post {
      addUserAccounts
    } ~ put {
      updateUserAccounts
    }
  } ~ pathPrefix("userAccounts") {
    path(LongNumber) { id => {
      getUserAccountById(id)
    }
    }
  }

  def updateUserAccounts = {
    headerValueByName("apiKey") { apiKey =>
      entity(as[String]) {
        jsonData => {
          complete {
            controller.updateUserDetails(apiKey, jsonData, ref).flatMap(s => {
              s.map(t => {
                HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
              })
            })
          }
        }
      }
    }
  }

  def getUserAccountById(id: Long) = {
    complete {
      controller.getUserAccountById(ref, id).flatMap(s => {
        s.map(t => {
          HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
        })
      })
    }
  }

  def getUserAccount = {
    complete {
      controller.getAllUserAccount(ref).flatMap(s => {
        s.map(t => {
          HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
        })
      })
    }
  }

  def addUserAccounts = {
    entity(as[String]) { jsonData => {
      complete {
        controller.addUserAccount(ref, jsonData).flatMap(s => {
          s.map(t => {
            HttpResponse(entity = HttpEntity(ContentType(MediaTypes.`application/json`), JsonImplicits.toJson(t)))
          })
        })
      }
    }
    }
  }
}

case class UserAccountWithApiKey(user: UserAccount, apiKey: String)