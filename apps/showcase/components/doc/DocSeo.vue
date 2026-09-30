<script>
export default {
    props: {
        title: { type: String, required: true },
        description: { type: String, required: true },
        jsonLd: { type: Object, default: null },
        type: { type: String, default: 'article' },
        noindex: { type: Boolean, default: false }
    },
    setup(props) {
        const route = useRoute();

        useSeo({
            title: props.title,
            description: props.description,
            path: route.path,
            type: props.type,
            jsonLd: props.jsonLd,
            noindex: props.noindex
        });

        return () => null;
    }
};
</script>
