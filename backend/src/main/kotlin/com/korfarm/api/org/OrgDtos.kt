package com.korfarm.api.org

data class OrgSummary(
    val id: String,
    val name: String
)

data class AdminOrgView(
    val orgId: String,
    val name: String,
    val plan: String?,
    val seatLimit: Int,
    val status: String
)

data class AdminClassView(
    val classId: String,
    val name: String,
    val levelId: String?,
    val grade: String?,
    val orgId: String,
    val orgName: String?,
    val seatCount: Int,
    val status: String
)

data class AdminStudentView(
    val userId: String,
    val loginId: String,
    val name: String,
    val gradeLabel: String?,
    val levelId: String?,
    val orgId: String?,
    val orgName: String?,
    val status: String
)
