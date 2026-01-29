import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  SHOP_CATEGORIES,
  SHOP_PRODUCTS,
  SHOP_SECTIONS,
} from "../data/shopCatalog";
import "../styles/commerce.css";

const formatPrice = (value) =>
  `${new Intl.NumberFormat("ko-KR").format(value)}원`;

const PAGE_SIZE = 10;

function ShopPage() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState({ textBook: 1, tool: 1 });

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
          <h3>장바구니 요약</h3>
          <ul className="commerce-list">
            <li>
              교재 1종 <span>29,000원</span>
            </li>
            <li>
              교구 1종 <span>15,000원</span>
            </li>
          </ul>
          <div className="commerce-total">
            <span>예상 결제금액</span>
            <strong>44,000원</strong>
          </div>
          <Link className="commerce-btn" to="/payment/result">
            결제 진행
          </Link>
          <div style={{ marginTop: "12px" }}>
            <Link className="commerce-btn ghost" to="/subscription">
              구독 관리
            </Link>
          </div>
          <div className="commerce-note">
            <strong>배송 안내</strong>
            <p>
              평일 오후 2시 이전 주문은 당일 출고됩니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ShopPage;
