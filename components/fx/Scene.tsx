"use client";

import dynamic from "next/dynamic";

// three.js only loads in the browser, after the page is already readable.
export const Scene3D = dynamic(() => import("./Stage"), { ssr: false });
export const Medallion = dynamic(() => import("./Medallion"), { ssr: false });
export const RobotWalker = dynamic(() => import("./RobotWalker"), { ssr: false });
