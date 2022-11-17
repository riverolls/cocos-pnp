import { IBuildResult, IBuildTaskOption } from "~types/packages/builder/@types";
import { initBuildFinishedEvent, initBuildStartEvent } from "@/core/builder-3x";

export function onBeforeBuild(options: IBuildTaskOption) {
  console.log(options)
  initBuildStartEvent(options)
}

export function onAfterBuild(options: IBuildTaskOption, result: IBuildResult) {
  console.log(options)
  initBuildFinishedEvent(options, result)
}