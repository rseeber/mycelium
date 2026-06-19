var editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new MarkdownWYSIWYG('site_editor', {
        initialValue: "## Hello World!\n\nThis is **Markdown** content.",
        onUpdate: (markdownContent) => {
        console.log("Updated content:", markdownContent);
        }
    });
    console.log("(frame) editor loaded");
    console.log("(frame) ", editor.getValue());
});

/*
window.addEventListener("message", (event) => {
    console.log("(frame) You just got a letter! ", event);
    // Do we trust the sender of this message?
    //if (event.origin !== window.location.origin) return;

    // event.source is window.opener
    // event.data is "hello there!"

    // Assuming you've verified the origin of the received message (which
    // you must do in any case), a convenient idiom for replying to a
    // message is to call postMessage on event.source and provide
    // event.origin as the targetOrigin.
    if(event.data == "GIMME editor"){
        event.source.postMessage(
            editor,
            event.origin,
        );
    }
});
*/