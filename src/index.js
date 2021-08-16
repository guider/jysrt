#!/usr/bin/env node
const path = require('path')
const fs = require('fs-extra')
const walk = require('klaw')
const commander = require('commander')
const inquirer = require('inquirer')
const signale = require('signale')
const Srt = require('./srt')

const { version } = require('../package.json')

const interactive = new signale.Signale({ interactive: true })
commander.version(version).
  on('--help', () => {
    console.log()
    console.log('Examples:')
    console.log('  $ dysrt ./template.json')
    console.log('  $ dysrt /**/ ')
  }).
  parse(process.argv)

if (process.argv.length < 3) {
  console.log('请指定字幕文件或工程目录')
  process.exit(1)
}

let filePath = process.argv[2]
if (fs.lstatSync(filePath).isFile()) {
  convertJson2Srt(filePath)
}else if (fs.lstatSync(filePath).isDirectory()){
  convertJson2Srt(filePath+'/template.tmp')
}

function convertJson2Srt (file) {
  // let originData = JSON.parse(fs.readFileSync(file))
  let originData = fs.readJSONSync(file)
  console.log(originData)
  let textTracks = (originData.tracks).filter(v => {
    console.log(v)
    return v.type=='text'
    // return v.sub_type == 'sub_sticker_text' && v.type == 'sticker'
  })

  textTracks = textTracks.flatMap(x => {
    return x.segments
  })
// textTracks=textTracks.map(v=>v.segments).flat(2)
  textTracks.sort((a, b) => {
    return a.target_timerange.start - b.target_timerange.start
  })

  let data = ''

  function formatTime (time) {
    if (time > -1) {
      var hour = Math.floor(time / 3600)
      var min = Math.floor(time / 60) % 60
      var sec = (time % 60).toFixed(3)
      if (hour < 10) {
        time = '0' + hour + ':'
      } else {
        time = hour + ':'
      }

      if (min < 10) {
        time += '0'
      }
      time += min + ':'

      if (sec < 10) {
        time += '0'
      }
      time += ('' + sec).replace('.', ',')
    }
    return time

  }

  textTracks.forEach((e, i) => {
    //生成字幕文件内容
    data += (i) + '\n' +
      formatTime(e.target_timerange.start / 1000/1000) + ' --> ' +
      formatTime(
        (e.target_timerange.start + e.target_timerange.duration) / 1000/1000) +
      '\n' +
      (originData.materials.texts.find(x => x.id == e.material_id).content) +
      '\n\n'
  })


  let resfile =('./dysrt-'+Date.now()+'.srt')
  fs.writeFile(resfile, data, (err) => {
    if (err) throw err
    console.log('字幕已被保存')
  })

}


