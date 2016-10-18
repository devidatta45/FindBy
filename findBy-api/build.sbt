name := "findBy-api"

version := "1.0"

scalaVersion := "2.11.8"

val akka = "2.4.10"
val json4sVersion = "3.4.0"
val session = "0.1.4"
val core = "0.2.7"

libraryDependencies ++= Seq(
  "com.typesafe.slick" %% "slick" % "3.1.1",
  "org.slf4j" % "slf4j-nop" % "1.6.4",
  "com.typesafe.slick" %% "slick-hikaricp" % "3.1.1",
  "postgresql" % "postgresql" % "9.1-901-1.jdbc4",
  "com.typesafe.akka" %% "akka-actor" % akka,
  "com.typesafe.akka" %% "akka-http-experimental" % akka,
  "com.typesafe.akka" %% "akka-http-core" % akka,
  "org.json4s" %% "json4s-jackson" % json4sVersion,
  "com.softwaremill.akka-http-session" %% "core" % core
)