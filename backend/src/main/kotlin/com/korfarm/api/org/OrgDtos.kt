package com.korfarm.api.org

data class OrgSummary(
    val id: String,
    val name: String
)

data class AdminOrgAdminView(
    val userId: String,
    val loginId: String,
    val name: String?,
    val phone: String?,
    val role: String
)

data class AdminOrgView(
    val orgId: String,
    val name: String,
    val plan: String?,
    val orgType: String?,
    val addressRegion: String?,
    val addressDetail: String?,
    val seatLimit: Int,
    val admins: List<AdminOrgAdminView>,
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
    val school: String?,
    val region: String?,
    val studentPhone: String?,
    val parentPhone: String?,
    val orgId: String?,
    val orgName: String?,
    val classIds: List<String>,
    val classNames: List<String>,
    val subscriptionStatus: String?,
    val subscriptionEndAt: String?,
    val status: String
)
