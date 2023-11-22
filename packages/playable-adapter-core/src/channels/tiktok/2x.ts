import { APPEND_TO_HEAD } from "./inject-vars"
import { exportSingleFile } from "@/exporter/2x"
import { TChannel, TChannelPkgOptions } from "@/typings"
import { exportConfigJson, getChannelRCSdkScript } from "@/utils"

export const export2xTiktok = async (options: TChannelPkgOptions) => {
  const { orientation } = options
  const channel: TChannel = "Tiktok"

  await exportSingleFile({
    ...options,
    channel,
    transformHTML: async ($) => {
      const sdkInjectScript = getChannelRCSdkScript(channel) || APPEND_TO_HEAD
      $("body script").first().before(sdkInjectScript)
    },
    transform: async (destPath) => {
      await exportConfigJson({
        destPath,
        orientation,
      })
    },
  })
}
