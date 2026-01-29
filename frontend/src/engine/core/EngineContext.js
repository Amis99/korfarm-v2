import { createContext, useContext } from "react";

const EngineContext = createContext(null);

export const useEngine = () => useContext(EngineContext);

export default EngineContext;
