/**
 * 점표기법 경로로 중첩 객체를 불변 업데이트.
 * 예: immutableSet(obj, 'questions[0].choices[1].text', '새 텍스트')
 */
export function immutableSet(obj, path, value) {
  const keys = parsePath(path);
  return setDeep(obj, keys, 0, value);
}

/**
 * 배열 내 특정 인덱스에 아이템 삽입
 */
export function immutableInsert(obj, path, index, newItem) {
  const arr = getByPath(obj, path);
  if (!Array.isArray(arr)) return obj;
  const copy = [...arr];
  copy.splice(index, 0, newItem);
  return immutableSet(obj, path, copy);
}

/**
 * 배열 내 특정 인덱스 아이템 제거
 */
export function immutableRemove(obj, path, index) {
  const arr = getByPath(obj, path);
  if (!Array.isArray(arr)) return obj;
  const copy = [...arr];
  copy.splice(index, 1);
  return immutableSet(obj, path, copy);
}

/**
 * 배열 내 아이템 순서 변경 (from → to)
 */
export function immutableReorder(obj, path, fromIndex, toIndex) {
  const arr = getByPath(obj, path);
  if (!Array.isArray(arr)) return obj;
  const copy = [...arr];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return immutableSet(obj, path, copy);
}

/**
 * 경로로 중첩 객체에서 값 읽기
 */
export function getByPath(obj, path) {
  const keys = parsePath(path);
  let cur = obj;
  for (const k of keys) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

/* 경로 파싱: 'a.b[0].c' → ['a','b',0,'c'] */
function parsePath(path) {
  const keys = [];
  const re = /([^.\[\]]+)|\[(\d+)\]/g;
  let m;
  while ((m = re.exec(path)) !== null) {
    if (m[2] !== undefined) {
      keys.push(Number(m[2]));
    } else {
      keys.push(m[1]);
    }
  }
  return keys;
}

/* 재귀적으로 불변 복사하며 값 설정 */
function setDeep(obj, keys, idx, value) {
  if (idx >= keys.length) return value;
  const key = keys[idx];
  const isArr = Array.isArray(obj);
  const clone = isArr ? [...obj] : { ...obj };
  clone[key] = setDeep(clone[key] ?? (typeof keys[idx + 1] === "number" ? [] : {}), keys, idx + 1, value);
  return clone;
}
