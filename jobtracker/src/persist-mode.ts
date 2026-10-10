/** Where the preview build keeps its data: the artifact's database ('cloud') or this browser only. */
export type PersistMode = 'cloud' | 'browser'
let mode: PersistMode = 'browser'
export const getPersistMode = () => mode
export const setPersistMode = (m: PersistMode) => { mode = m }
