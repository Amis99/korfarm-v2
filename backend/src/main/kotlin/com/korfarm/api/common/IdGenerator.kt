package com.korfarm.api.common

import java.util.UUID

object IdGenerator {
    fun newId(prefix: String): String {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "")
    }
}
