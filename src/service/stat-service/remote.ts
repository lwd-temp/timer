import OptionDatabase from "@db/option-database"
import { StatCondition } from "@db/stat-database"
import processor from "@src/common/backup/processor"
import { judgeVirtualFast } from "@util/pattern"
import { getBirthday } from "@util/time"

const optionDatabase = new OptionDatabase(chrome.storage.local)

const keyOf = (row: timer.stat.RowKey) => `${row.date}${row.host}`

export async function processRemote(param: StatCondition, origin: timer.stat.Row[]): Promise<timer.stat.Row[]> {
    const { backupType, backupAuths } = await optionDatabase.getOption()
    const auth = backupAuths?.[backupType]
    const canReadRemote = await canReadRemote0(backupType, auth)
    if (!canReadRemote) {
        return origin
    }
    // Map to merge
    const originMap: Record<string, timer.stat.Row> = {}
    origin.forEach(row => originMap[keyOf(row)] = {
        ...row,
        composition: {
            focus: [row.focus],
            time: [row.time],
        }
    })
    // Predicate with host
    const { host, fullHost } = param
    const predicate: (row: timer.stat.RowBase) => boolean = host
        // With host condition
        ? fullHost
            // Full match
            ? r => r.host === host
            // Fuzzy match
            : r => r.host && r.host.includes(host)
        // Without host condition
        : _r => true
    // 1. query remote
    let start: Date = undefined, end: Date = undefined
    if (param.date instanceof Array) {
        start = param.date?.[0]
        end = param.date?.[1]
    } else {
        start = param.date
    }
    start = start || getBirthday()
    end = end || new Date()
    const remote = await processor.query(backupType, auth, start, end)
    remote.filter(predicate).forEach(row => processRemoteRow(originMap, row))
    return Object.values(originMap)
}

/**
 * Aable to read remote backup data
 * 
 * @since 1.2.0
 * @returns T/F
 */
export async function canReadRemote(): Promise<boolean> {
    const { backupType, backupAuths } = await optionDatabase.getOption()
    return await canReadRemote0(backupType, backupAuths?.[backupType])
}

async function canReadRemote0(backupType: timer.backup.Type, auth: string): Promise<boolean> {
    return backupType && backupType !== 'none' && !await processor.test(backupType, auth)
}

function processRemoteRow(rowMap: Record<string, timer.stat.Row>, row: timer.stat.Row) {
    const key = keyOf(row)
    let exist = rowMap[key]
    !exist && (exist = rowMap[key] = {
        date: row.date,
        host: row.host,
        time: 0,
        focus: 0,
        composition: {
            focus: [],
            time: [],
        },
        mergedHosts: [],
        virtual: judgeVirtualFast(row.host)
    })

    const focus = row.focus || 0
    const time = row.time || 0

    exist.focus += focus
    exist.time += time
    focus && exist.composition.focus.push({ cid: row.cid, cname: row.cname, value: focus })
    time && exist.composition.time.push({ cid: row.cid, cname: row.cname, value: time })
}