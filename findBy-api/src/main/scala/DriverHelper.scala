import slick.driver.PostgresDriver
import slick.driver.PostgresDriver.api._
import slick.lifted.CanBeQueryCondition

import scala.concurrent.Future
import scala.reflect.ClassTag

/**
  * Created by devidatta on 8/4/2016.
  */
object DriverHelper extends PostgresDriver {
  val user = "postgres"
  val url = "jdbc:postgresql://localhost:5432/spatial"
  val password = "admin"
  val jdbcDriver = "org.postgresql.Driver"
  val db = Database.forURL(url, user = user, password = password, driver = jdbcDriver)
}

trait BaseEntity {
  val id: Long
  val isDeleted: Boolean
}

abstract class BaseTable[E: ClassTag](tag: Tag, schemaName: Option[String], tableName: String) extends Table[E](tag, schemaName, tableName) {
  val id: Rep[Long] = column[Long]("Id", O.PrimaryKey, O.AutoInc)
  val isDeleted: Rep[Boolean] = column[Boolean]("IsDeleted", O.Default(false))
}

trait BaseRepositoryQuery[T <: BaseTable[E], E <: BaseEntity] {
  val query: PostgresDriver.api.type#TableQuery[T]

  def getByIdQuery(id: Long) = {
    query.filter(_.id === id).filter(_.isDeleted === false)
  }

  def getAllQuery = {
    query.filter(_.isDeleted === false)
  }

  def getAllQyeryTrue={
    query.filter(_.isDeleted===true)
  }

  def filterQuery[C <: Rep[_]](expr: T => C)(implicit wt: CanBeQueryCondition[C]) = {
    query.filter(expr).filter(_.isDeleted === false)
  }

  def saveQuery(row: E) = {
    query returning query += row
  }

  def deleteByIdQuery(id: Long) = {
    query.filter(_.id === id).map(_.isDeleted).update(true)
  }

  def updateByIdQuery(id: Long, row: E) = {
    query.filter(_.id === id).filter(_.isDeleted === false).update(row)
  }
  def updateByIdQueryWithout(id: Long, row: E) ={
    query.filter(_.id === id).update(row)
  }
}

abstract class BaseRepository[T <: BaseTable[E], E <: BaseEntity : ClassTag](clazz: TableQuery[T]) extends BaseRepositoryQuery[T, E] {

  val clazzTable: TableQuery[T] = clazz
  val query: PostgresDriver.api.type#TableQuery[T] = clazz
  val db: PostgresDriver.backend.DatabaseDef = DriverHelper.db

  def getAll: Future[Seq[E]] = {
    db.run(getAllQuery.result)
  }

  def getAllTrue:Future[Seq[E]]={
    db.run(getAllQyeryTrue.result)
  }

  def getById(id: Long): Future[Option[E]] = {
    db.run(getByIdQuery(id).result.headOption)
  }

  def filter[C <: Rep[_]](expr: T => C)(implicit wt: CanBeQueryCondition[C]) = {
    db.run(filterQuery(expr).result)
  }

  def save(row: E): Future[E] = {
    db.run(saveQuery(row))
  }

  def updateById(id: Long, row: E) = {
    db.run(updateByIdQuery(id, row))
  }

  def updateByIdWithout(id: Long, row: E) = {
    db.run(updateByIdQueryWithout(id, row))
  }

  def deleteById(id: Long) = {
    db.run(deleteByIdQuery(id))
  }
}