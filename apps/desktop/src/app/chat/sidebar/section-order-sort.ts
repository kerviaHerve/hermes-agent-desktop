export function orderSidebarSections<T>(sections: T[], getId: (section: T) => string, orderIds: string[]): T[] {
  const ranks = new Map([...new Set(orderIds)].map((id, index) => [id, index]))

  return [...sections].sort(
    (left, right) => (ranks.get(getId(left)) ?? Infinity) - (ranks.get(getId(right)) ?? Infinity)
  )
}
