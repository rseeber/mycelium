import React, { createRef } from 'react'
import { diffSourcePlugin, DiffSourceToggleWrapper, MDXEditor  } from '@mdxeditor/editor'
import { headingsPlugin, UndoRedo, BoldItalicUnderlineToggles, 
  toolbarPlugin, quotePlugin, listsPlugin, thematicBreakPlugin, 
  linkPlugin, linkDialogPlugin, BlockTypeSelect, CreateLink, 
  CodeToggle } from '@mdxeditor/editor'

import '@mdxeditor/editor/style.css'

function EditorApp_Full({ editorRef, startingMd }) {
  return (
  <>
    <MDXEditor
      ref={editorRef}
      markdown={startingMd}
      plugins={[
        toolbarPlugin({
          toolbarClassName: 'my-classname',
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <CreateLink />
              <CodeToggle />
              <DiffSourceToggleWrapper>
                <UndoRedo />
              </DiffSourceToggleWrapper>

            </>
          )
        }),
        diffSourcePlugin({ 
          diffMarkdown: startingMd, 
          viewMode: "rich-text",
          readOnlyDiff: true
        }),
        headingsPlugin(),
        quotePlugin(),
        listsPlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin()
      ]}
    />
  </>
  )

}

function EditorApp_Plaintext({ editorRef, startingMd }) {
  return (
  <>
    <MDXEditor
      ref={editorRef}
      markdown={startingMd}
      plugins={[
        toolbarPlugin({
          toolbarClassName: 'my-classname',
          toolbarContents: () => (
            <>
            </>
          )
        }),
      ]}
    />
  </>
  )

}


export { EditorApp_Full };
export { EditorApp_Plaintext };