import { shell } from 'electron'
import { IBuildTaskOption } from "~types/packages/builder/@types";
import { run } from "node-cmd"
import { BUILDER_NAME } from "@/extensions/constants";
import { checkOSPlatform, getAdapterConfig, getRCSkipBuild, getRealPath } from "@/extensions/utils";
import { Worker } from 'worker_threads'
import { exec3xAdapter } from 'playable-adapter-core'
import workPath from '../worker/3x?worker'
import { join } from 'path';

const runBuilder = (buildPlatform: TPlatform) => {
  return new Promise<void>((resolve, reject) => {
    let cocosBuilderPath = Editor.App.path
    const platform = checkOSPlatform()
    if (platform === 'MAC') {
      cocosBuilderPath = cocosBuilderPath.replace('/Resources/app.asar', '/MacOS/CocosCreator')
    } else if (platform === 'WINDOWS') {
      cocosBuilderPath = getRealPath(cocosBuilderPath).replace('/resources/app.asar', '/CocosCreator.exe')
    } else {
      reject(`不支持${platform}平台构建`)
    }

    const processRef = run(`${cocosBuilderPath} --project ${Editor.Project.path} --build "platform=${buildPlatform}"`, (err, data, stderr) => {
      console.log(err, data, stderr)
      resolve()
    })
    //listen to the python terminal output
    processRef.stdout.on('data', (data: string) => {
      console.log(data);
    });
  })
}

export const initBuildStartEvent = async (options: Partial<IBuildTaskOption>) => {
  console.log(`${BUILDER_NAME} 进行预构建处理`)
  console.log(`${BUILDER_NAME} 跳过预构建处理`)
}

export const initBuildFinishedEvent = (options: Partial<IBuildTaskOption>) => {
  return new Promise(async (resolve) => {
    console.info(`${BUILDER_NAME} 开始适配，导出平台 ${options.platform}`)

    const start = new Date().getTime();

    const handleExportEnd = () => {
      const end = new Date().getTime();
      console.log(`${BUILDER_NAME} 适配完成，共耗时${((end - start) / 1000).toFixed(0)}秒`)
      resolve(true)
    }

    const {
      projectRootPath,
      projectBuildPath,
      adapterBuildConfig,
    } = getAdapterConfig()

    const buildFolderPath = join(projectRootPath, projectBuildPath)
    const params = {
      buildFolderPath,
      adapterBuildConfig: {
        ...adapterBuildConfig,
        buildPlatform: options.platform!
      },
    }

    if (typeof(Worker) !== undefined) {
      console.log('支持Worker，将开启子线程适配')
      const worker = new Worker(workPath, {
        workerData: params
      })
      worker.on('message', () => {
        handleExportEnd()
      })
    } else {
      console.log('不支持Worker，将开启主线程适配')
      await exec3xAdapter({
        buildFolderPath,
        adapterBuildConfig: {
          ...adapterBuildConfig,
          buildPlatform: options.platform,
        }
      }, {
        mode: 'serial'
      })
      handleExportEnd()
    }
  })
}

export const builder3x = async () => {
  try {
    // 初始化 start
    const {
      buildPlatform,
      projectRootPath,
      projectBuildPath,
    } = getAdapterConfig()
    // 初始化 end
    console.log(`开始构建项目，导出${buildPlatform}包`)
    const isSkipBuild = getRCSkipBuild()
    const buildPath = join(projectRootPath, projectBuildPath)

    await initBuildStartEvent({
      platform: buildPlatform
    })
    if (!isSkipBuild) {
      await runBuilder(buildPlatform)
    }
    await initBuildFinishedEvent({
      platform: buildPlatform
    })
    shell.openPath(buildPath)
    console.log('构建完成')
  } catch (error) {
    console.error(error)
  }
}
