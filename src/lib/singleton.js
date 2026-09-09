/**
 * Evaluate callback only once, store in globals by key
 */
export default function singleton(key, identity) {
  if (!global.singletons) global.singletons = {}
  if (!(key in global.singletons)) global.singletons[key] = identity()
  return global.singletons[key]
}
