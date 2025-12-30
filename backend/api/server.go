package api

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"

	"github.com/liubkkkko/firstAPI/api/controllers"
	"github.com/liubkkkko/firstAPI/api/seed"
	"github.com/liubkkkko/firstAPI/api/tokenstorage"
)

var server = controllers.Server{}

func Run() {

appEnv := os.Getenv("APP_ENV")
if appEnv == "" {
    appEnv = "local"
}
log.Println("APP_ENV =", appEnv)


if os.Getenv("APP_ENV") != "production" {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using environment variables")
    }
}
	server.Initialize(
		os.Getenv("DB_DRIVER"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_NAME"),
	)

	tokenstorage.RedisStart(
		os.Getenv("REDIS_ADDR"),
		os.Getenv("REDIS_PASSWORD"),
		os.Getenv("REDIS_DB"),
	)

	seed.Load(server.DB)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	server.Run(addr)
}
