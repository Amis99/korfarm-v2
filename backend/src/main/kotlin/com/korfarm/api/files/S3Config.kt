package com.korfarm.api.files

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.presigner.S3Presigner

/**
 * S3 클라이언트 빈 — 업로드/다운로드 공용.
 *
 * 자격증명 우선순위 (DefaultCredentialsProvider):
 * 1. 환경변수 AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 * 2. ~/.aws/credentials
 * 3. EC2 IAM Role
 *
 * 현재 EC2 는 root credential 이 ~/.aws/credentials 에 있어 자동 인식.
 */
@Configuration
class S3Config(
    @Value("\${app.s3.region:ap-northeast-2}") private val region: String,
) {
    @Bean
    fun s3Client(): S3Client = S3Client.builder()
        .region(Region.of(region))
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()

    @Bean
    fun s3Presigner(): S3Presigner = S3Presigner.builder()
        .region(Region.of(region))
        .credentialsProvider(DefaultCredentialsProvider.create())
        .build()
}
