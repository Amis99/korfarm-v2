import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  SHOP_CATEGORIES,
  SHOP_PRODUCTS,
  SHOP_SECTIONS,
} from "../data/shopCatalog";
import { apiGet, apiPut } from "../utils/api";
import "../styles/commerce.css";

const formatPrice = (value) =>
  `${new Intl.NumberFormat("ko-KR").format(value)}원`;

const PAGE_SIZE = 10;

function ShopPage() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState({ textBook: 1, tool: 1 });

  // 배송지 관련 상태
  const EMPTY_SHIPPING = {
    shippingName: "",
    shippingPhone: "",
    shippingZipCode: "",
    shippingAddress: "",
    shippingAddressDetail: "",
  };
  const [shipping, setShipping] = useState(EMPTY_SHIPPING);
  const [shippingEditing, setShippingEditing] = useState(false);
  const [shippingSaved, setShippingSaved] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);

  const hasShipping = shipping.shippingName && shipping.shippingAddress;

  // 배송지 로드
  useEffect(() => {
    apiGet("/v1/auth/me")
      .then((res) => {
        if (res?.data) {
          const d = res.data;
          const loaded = {
            shippingName: d.shippingName || "",
            shippingPhone: d.shippingPhone || "",
            shippingZipCode: d.shippingZipCode || "",
            shippingAddress: d.shippingAddress || "",
            shippingAddressDetail: d.shippingAddressDetail || "",
          };
          setShipping(loaded);
          if (loaded.shippingName && loaded.shippingAddress) {
            setShippingSaved(true);
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleShippingChange = useCallback((e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleShippingSave = useCallback(async () => {
    setShippingSaving(true);
    try {
      await apiPut("/v1/auth/me", shipping);
      setShippingSaved(true);
      setShippingEditing(false);
    } catch {
      alert("배송지 저장에 실패했습니다.");
    } finally {
      setShippingSaving(false);
    }
  }, [shipping]);

  useEffect(() => {
    setPages({ textBook: 1, tool: 1 });
  }, [category, query]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SHOP_PRODUCTS.filter((product) => {
      const matchCategory =
        category === "all" || product.category === category;
      const searchable = [product.name, product.level, product.tags.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQuery = !normalized || searchable.includes(normalized);
      return matchCategory && matchQuery;
    });
  }, [category, query]);

  const getPageKey = (sectionId) =>
    sectionId === "textbook" ? "textBook" : "tool";

  const getPagedItems = (sectionId, items) => {
    const pageKey = getPageKey(sectionId);
    const page = pages[pageKey] || 1;
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return {
      page: safePage,
      totalPages,
      items: items.slice(start, start + PAGE_SIZE),
      pageKey,
    };
  };

  const handlePageChange = (pageKey, nextPage) => {
    setPages((prev) => ({ ...prev, [pageKey]: nextPage }));
  };

  return (
    <div className="commerce-page">
      <div className="commerce-wrap commerce-hero">
        <Link to="/start" className="commerce-back-link">
          <span className="material-symbols-outlined">arrow_back</span>
          홈으로
        </Link>
        <span className="commerce-pill">교재 · 교구 쇼핑</span>
        <h1>국어농장 쇼핑몰</h1>
        <p>
          수업에 바로 쓰는 교재와 교구를 한 곳에서 준비하세요.
        </p>
        <div className="commerce-hero-actions">
          <a className="commerce-btn ghost" href="#textbook">
            교재 보기
          </a>
          <a className="commerce-btn" href="#tool">
            교구 보기
          </a>
        </div>
      </div>

      <div className="commerce-wrap commerce-grid">
        <div className="commerce-main">
          <div className="commerce-card commerce-filter">
            <div className="commerce-tabs">
              {SHOP_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`commerce-tab ${category === item.id ? "active" : ""}`}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="commerce-search">
              <span className="material-symbols-outlined">search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="교재/교구 검색"
              />
            </div>
          </div>

          {SHOP_SECTIONS.map((section) => {
            const sectionProducts = visibleProducts.filter(
              (product) => product.category === section.id
            );
            if (sectionProducts.length === 0) {
              return null;
            }
            const pagination = getPagedItems(section.id, sectionProducts);
            return (
              <section
                key={section.id}
                id={section.anchor}
                className="commerce-section"
              >
                <div className="commerce-section-header">
                  <div>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                  <span className="commerce-section-meta">{section.meta}</span>
                </div>
                <div className="commerce-products">
                  {pagination.items.map((product) => (
                    <Link
                      key={product.id}
                      to={`/shop/products/${product.id}`}
                      className="commerce-product"
                    >
                      <img src={product.image} alt={product.name} />
                      <div className="commerce-meta">
                        <span className="commerce-tag">{section.title}</span>
                        {product.badge && (
                          <span className="commerce-tag accent">
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <h3>{product.name}</h3>
                      <p className="commerce-desc">{product.summary}</p>
                      <div className="commerce-product-footer">
                        <span className="commerce-price">
                          {formatPrice(product.price)}
                        </span>
                        <span className="commerce-btn ghost">
                          상세 보기
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {pagination.totalPages > 1 ? (
                  <div className="commerce-pagination">
                    <button
                      type="button"
                      className="commerce-page-btn"
                      onClick={() =>
                        handlePageChange(pagination.pageKey, pagination.page - 1)
                      }
                      disabled={pagination.page === 1}
                    >
                      이전
                    </button>
                    <div className="commerce-page-list">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, index) => {
                          const pageNumber = index + 1;
                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              className={`commerce-page-number ${
                                pagination.page === pageNumber ? "active" : ""
                              }`}
                              onClick={() =>
                                handlePageChange(pagination.pageKey, pageNumber)
                              }
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <button
                      type="button"
                      className="commerce-page-btn"
                      onClick={() =>
                        handlePageChange(pagination.pageKey, pagination.page + 1)
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      다음
                    </button>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <aside className="commerce-card commerce-sidebar">
          <h3>안내</h3>
          <p style={{ fontSize: "14px", color: "#6b5b50", lineHeight: 1.6 }}>
            상품 상세 페이지에서 바로 구매하실 수 있습니다.
          </p>
          <div style={{ marginTop: "12px" }}>
            <Link className="commerce-btn ghost" to="/shop">
              상품 목록 보기
            </Link>
          </div>
          <div style={{ marginTop: "12px" }}>
            <Link className="commerce-btn ghost" to="/subscription">
              구독 관리
            </Link>
          </div>
          <div className="commerce-note">
            <strong>기본 배송지</strong>
            {shippingSaved && !shippingEditing ? (
              <div style={{ marginTop: "8px", fontSize: "13px", lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>{shipping.shippingName} / {shipping.shippingPhone}</p>
                <p style={{ margin: 0 }}>({shipping.shippingZipCode}) {shipping.shippingAddress}</p>
                {shipping.shippingAddressDetail && (
                  <p style={{ margin: 0 }}>{shipping.shippingAddressDetail}</p>
                )}
                <button
                  type="button"
                  className="commerce-btn ghost"
                  style={{ marginTop: "8px", width: "100%", fontSize: "13px" }}
                  onClick={() => setShippingEditing(true)}
                >
                  수정
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <input
                  name="shippingName"
                  value={shipping.shippingName}
                  onChange={handleShippingChange}
                  placeholder="수령인"
                  className="commerce-input"
                />
                <input
                  name="shippingPhone"
                  value={shipping.shippingPhone}
                  onChange={handleShippingChange}
                  placeholder="연락처"
                  className="commerce-input"
                />
                <input
                  name="shippingZipCode"
                  value={shipping.shippingZipCode}
                  onChange={handleShippingChange}
                  placeholder="우편번호"
                  className="commerce-input"
                />
                <input
                  name="shippingAddress"
                  value={shipping.shippingAddress}
                  onChange={handleShippingChange}
                  placeholder="기본주소"
                  className="commerce-input"
                />
                <input
                  name="shippingAddressDetail"
                  value={shipping.shippingAddressDetail}
                  onChange={handleShippingChange}
                  placeholder="상세주소"
                  className="commerce-input"
                />
                <button
                  type="button"
                  className="commerce-btn"
                  style={{ width: "100%", fontSize: "13px" }}
                  onClick={handleShippingSave}
                  disabled={shippingSaving || !shipping.shippingName || !shipping.shippingAddress}
                >
                  {shippingSaving ? "저장 중..." : "배송지 저장"}
                </button>
                {shippingEditing && (
                  <button
                    type="button"
                    className="commerce-btn ghost"
                    style={{ width: "100%", fontSize: "13px" }}
                    onClick={() => setShippingEditing(false)}
                  >
                    취소
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ShopPage;
