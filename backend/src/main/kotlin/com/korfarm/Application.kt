package com.korfarm

import com.korfarm.api.org.OrgRepository
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
class KorfarmApplication {
    @Bean
    fun renameHqOrg(orgRepository: OrgRepository) = ApplicationRunner {
        // org_hq 이름을 '국어농장'으로 변경 (한 번만 실행되어도 무해)
        orgRepository.findById("org_hq").ifPresent { org ->
            if (org.name != "국어농장") {
                org.name = "국어농장"
                orgRepository.save(org)
            }
        }
    }
}

fun main(args: Array<String>) {
    runApplication<KorfarmApplication>(*args)
}
