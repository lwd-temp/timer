/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { PropType } from "vue"

import { watch } from "vue"
import { ElOption, ElSelect } from "element-plus"
import { defineComponent } from "vue"
import { useRoute } from "vue-router"
import { useCached } from "@hooks/useCached"

const _default = defineComponent({
    props: {
        defaultValue: String,
        /**
         * Whether to save the value in the localStorage with {@param historyName}
         */
        historyName: String,
        options: Object as PropType<Record<string | number, string>>
    },
    emits: {
        select: (_val: string) => true
    },
    setup(props, ctx) {
        const cacheKey = `__filter_item_select_${useRoute().path}_${props.historyName}`
        const { data, setter } = useCached(cacheKey, props.defaultValue)
        watch(data, () => ctx.emit('select', data.value))
        return () => <ElSelect class="filter-item" modelValue={data.value} onChange={setter}>
            {Object.entries(props.options || {}).map(([value, label]) => <ElOption label={label} value={value} />)}
        </ElSelect>
    }
})

export default _default