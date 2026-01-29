package com.korfarm

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class KorfarmApplication

fun main(args: Array<String>) {
    runApplication<KorfarmApplication>(*args)
}
