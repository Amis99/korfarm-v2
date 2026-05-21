package com.korfarm

import com.korfarm.api.org.OrgRepository
import com.korfarm.api.test.TestService
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
@EnableAsync
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

    /**
     * N-16 (2026-05-21) — payload_json 은 있는데 test_questions 가 비어있는
     * 일반 시험을 부팅 시 일괄 재동기화. 자세한 내용은 TestService.bulkSyncQuestionsFromPayload.
     */
    @Bean
    fun bulkSyncTestQuestionsFromPayload(testService: TestService) = ApplicationRunner {
        try {
            val result = testService.bulkSyncQuestionsFromPayload()
            val cnt = result["syncedCount"] as? Int ?: 0
            if (cnt > 0) {
                org.slf4j.LoggerFactory.getLogger(KorfarmApplication::class.java)
                    .info("부팅 시 test_questions bulkSync — synced=$cnt, ids=${result["syncedIds"]}")
            }
        } catch (e: Exception) {
            org.slf4j.LoggerFactory.getLogger(KorfarmApplication::class.java)
                .warn("부팅 시 test_questions bulkSync 실패: ${e.message}", e)
        }
    }
}

fun main(args: Array<String>) {
    runApplication<KorfarmApplication>(*args)
}
