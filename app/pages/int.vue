<script setup lang="ts">
import ToolHeader from "~/components/tool-header.vue";
import ToolHeaderHighlight from "~/components/tool-header-highlight.vue";
import IntSizeTable from "~/components/int/int-size-table.vue";
import IntSizeChecker from "~/components/int/int-size-checker.vue";
import {baseUrl, makeTitle} from "~~/src/constants";
import logo from "~/assets/img/logo.png";

const title = 'Integer Size';
const description = 'Shows required bit size and compatibility with common signed and unsigned integer types.';

const pageTitle = makeTitle(title);
useSeoMeta({
    title: pageTitle,
});

if (import.meta.server) {
    useSeoMeta({
        description: description,
        ogTitle: pageTitle,
        ogDescription: description,
        ogImage: baseUrl(logo),
        ogUrl: baseUrl(`/int`),
        ogType: 'website',
        ogSiteName: pageTitle,
        twitterCard: 'summary_large_image',
        twitterTitle: pageTitle,
        twitterDescription: description,
        twitterImage: baseUrl(logo),
    });
}
</script>

<template>
    <ToolHeader :description="description">
        Inspect <ToolHeaderHighlight :title="title" />
    </ToolHeader>

    <div class="mb-6">
        <IntSizeChecker />
    </div>
    <IntSizeTable />
</template>