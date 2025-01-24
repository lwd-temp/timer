import { sendMsg2Runtime } from "@api/chrome/runtime"
import Trend from "@app/Layout/icons/Trend"
import { judgeVerificationRequired, processVerification } from "@app/util/limit"
import { TAG_NAME } from "@cs/limit/element"
import { t } from "@cs/locale"
import { Plus, Timer } from "@element-plus/icons-vue"
import optionHolder from "@service/components/option-holder"
import { meetTimeLimit } from "@util/limit"
import { ElButton } from "element-plus"
import { computed, defineComponent } from "vue"
import { useDelayHandler, useReason, useRule } from "../context"

async function handleMore5Minutes(rule: timer.limit.Item, callback: () => void) {
    let promise: Promise<void> = undefined
    const ele = document.querySelector(TAG_NAME).shadowRoot.querySelector('body')
    if (await judgeVerificationRequired(rule)) {
        const option = await optionHolder.get()
        promise = processVerification(option, { appendTo: ele })
        promise ? promise.then(callback).catch(() => { }) : callback()
    } else {
        callback()
    }
}

const _default = defineComponent(() => {
    const reason = useReason()
    const rule = useRule()
    const showDelay = computed(() => {
        const { type, allowDelay, delayCount } = reason.value || {}
        if (!allowDelay) return false

        const { time, weekly, visit, waste, weeklyWaste } = rule.value || {}
        let realLimit = 0, realWaste = 0
        if (type === 'DAILY') {
            realLimit = time
            realWaste = waste
        } else if (type === 'WEEKLY') {
            realLimit = weekly
            realWaste = weeklyWaste
        } else if (type === 'VISIT') {
            realLimit = visit
            realWaste = reason.value?.getVisitTime?.()
        } else {
            return false
        }
        return meetTimeLimit(realLimit, realWaste, allowDelay, delayCount)
    })

    const delayHandler = useDelayHandler()

    return () => (
        <div class='footer-container'>
            <ElButton
                round
                icon={<Trend />}
                type="success"
                onClick={() => sendMsg2Runtime('cs.openAnalysis')}
            >
                {t(msg => msg.menu.siteAnalysis)}
            </ElButton>
            <ElButton
                v-show={showDelay.value}
                type="primary"
                round
                icon={<Plus />}
                onClick={() => handleMore5Minutes(rule.value, delayHandler)}
            >
                {t(msg => msg.modal.more5Minutes)}
            </ElButton>
            <ElButton
                round
                icon={<Timer />}
                onClick={() => sendMsg2Runtime('cs.openLimit')}
            >
                {t(msg => msg.modal.ruleDetail)}
            </ElButton>
        </div>
    )
})

export default _default