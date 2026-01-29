package com.korfarm.api.files

import org.springframework.data.jpa.repository.JpaRepository

interface FileRepository : JpaRepository<FileEntity, String>
