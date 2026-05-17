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

/** 회원 통합 뷰 — 학생/학부모/기관관리자 모두 같은 구조로 노출. HQ_ADMIN 회원 관리 화면용. */
data class AdminMemberView(
    val userId: String,
    val loginId: String,
    val name: String?,
    val role: String,                       // STUDENT / PARENT / ORG_ADMIN
    val orgId: String?,
    val orgName: String?,
    val phone: String?,                     // 학생은 studentPhone, 학부모는 parentPhone, 관리자는 studentPhone(연락처 컬럼 재활용)
    val email: String?,
    val membershipStatus: String,
    val createdAt: String,
    // 학생 추가
    val levelId: String? = null,
    val gradeLabel: String? = null,
    val school: String? = null,
    val region: String? = null,
    // 학부모 추가 — 연결된 학생들
    val linkedStudentNames: List<String> = emptyList(),
)

data class AdminOrgView(
    val orgId: String,
    val name: String,
    val plan: String?,
    val orgType: String?,
    val addressRegion: String?,
    val addressDetail: String?,
    val logoFileId: String?,
    val monthlyBaseFeeOverride: Int?,
    val billingSuspended: Boolean,
    val seatLimit: Int,
    val admins: List<AdminOrgAdminView>,
    val status: String,
    // 사업자 정보 (V0139)
    val businessNumber: String? = null,
    val representativeName: String? = null,
    val contactPhone: String? = null,
    val contactEmail: String? = null,
    val taxEmail: String? = null,
)

data class AdminClassView(
    val classId: String,
    val name: String,
    val description: String?,
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
    val status: String,
    val createdAt: String? = null,  // 가입일 (ISO 문자열)
)
