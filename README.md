# 习惯打卡站

一个完全离线、单用户的 Windows 习惯打卡应用。支持多个每日习惯、今日打卡、连续天数、最长纪录、单习惯月历和补打卡。

## 技术栈

- Neutralinojs 6 + 系统 WebView2
- React 19 + TypeScript + Vite
- Neutralino 本地 Storage JSON 持久化
- Vitest + Testing Library

## 开发

```powershell
npm install
npm run framework:update
npm run desktop:dev
```

只开发前端界面时可以运行；非 Neutralino 环境会自动改用浏览器 localStorage：

```powershell
npm run dev
```

## 验证与打包

```powershell
npm test
npm run build
npm run desktop:build
```

`desktop:build` 会生成带内嵌资源的单文件 Windows EXE，并复制为 `release/习惯打卡站.exe`。备用 ZIP 包使用：

```powershell
npm run desktop:release
```

## 数据

数据保存在 `release\.storage`，WebView2 缓存保存在 `release\.userdata`，不会写入 `%APPDATA%`。请始终双击 `习惯打卡站.exe`；它是本地启动器，会启动同目录下的 `习惯打卡站-core.exe`。备份或移动时请复制整个 `release` 文件夹。

## 设计参考

交互和数据思路参考了以下开源项目，但本仓库为独立实现，未复制其代码：

- [Loop Habit Tracker](https://github.com/iSoron/uhabits)
- [MakeMyDay](https://github.com/joeseesun/makemyday)





