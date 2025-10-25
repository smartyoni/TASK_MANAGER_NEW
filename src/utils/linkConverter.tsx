import type { ReactNode } from 'react';

/**
 * 텍스트에서 URL을 감지하고 하이퍼링크로 변환하는 유틸리티
 */

// URL 정규식 (http, https, www로 시작하는 URL, 이메일 제외)
const URL_REGEX = /(https?:\/\/[^\s<>"\)]+)|(www\.[^\s<>"\)]+)/gi;

/**
 * 텍스트에서 URL을 감지하여 React 엘리먼트로 변환
 * @param text - 변환할 텍스트
 * @returns 텍스트와 링크가 혼합된 React 엘리먼트 배열
 */
export function convertLinksToElements(text: string): (string | ReactNode)[] {
  const parts: (string | ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 정규식 재설정 (g 플래그를 사용하므로 lastIndex를 초기화해야 함)
  const regex = new RegExp(URL_REGEX.source, URL_REGEX.flags);

  while ((match = regex.exec(text)) !== null) {
    // 매치 이전의 텍스트 추가
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const url = match[0];
    // www로 시작하는 경우 https:// 추가
    const fullUrl = url.startsWith('www') ? `https://${url}` : url;

    // 링크 엘리먼트 추가
    parts.push(
      <a
        key={`link-${match.index}`}
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline hover:underline break-all"
        title={fullUrl}
      >
        {url}
      </a>
    );

    lastIndex = regex.lastIndex;
  }

  // 마지막 텍스트 추가
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // 빈 배열이면 원본 텍스트 반환
  return parts.length === 0 ? [text] : parts;
}

/**
 * 텍스트를 여러 줄로 나누고 각 줄의 URL을 변환
 * @param text - 변환할 텍스트
 * @returns 줄별로 나뉜 React 엘리먼트 배열
 */
export function convertLinksToElementsWithLineBreaks(text: string): ReactNode[] {
  return text.split('\n').map((line, index) => (
    <div key={`line-${index}`} className="whitespace-pre-wrap">
      {convertLinksToElements(line)}
    </div>
  ));
}
