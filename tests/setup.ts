import "@testing-library/jest-dom";

// no database in tests: the store service keeps everything in memory
(globalThis as { __SHOPERSITE_OFFLINE__?: boolean }).__SHOPERSITE_OFFLINE__ = true;
