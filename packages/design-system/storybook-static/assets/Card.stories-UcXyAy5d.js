import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import"./index-yBjzXJbu.js";const h=({children:d,variant:a="flat",padding:t="default",className:i=""})=>{const x={flat:"bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]",raised:"bg-[var(--color-bg-surface-elevated)] shadow-[var(--shadow-raised)]",inset:"bg-[var(--color-bg-inset)] shadow-[var(--shadow-inset)] border border-[var(--color-border-subtle)]"},b={none:"",compact:"p-3",default:"p-4",spacious:"p-6"};return e.jsx("div",{className:`
        rounded-[var(--radius-lg)]
        ${x[a]}
        ${b[t]}
        ${i}
      `,children:d})},y=({title:d,subtitle:a,actions:t,className:i=""})=>e.jsxs("div",{className:`flex items-start justify-between gap-4 ${i}`,children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h3",{className:"font-semibold text-[var(--color-text-primary)] truncate",children:d}),a&&e.jsx("p",{className:"text-sm text-[var(--color-text-secondary)] mt-0.5",children:a})]}),t&&e.jsx("div",{className:"flex-shrink-0",children:t})]});h.__docgenInfo={description:"",methods:[],displayName:"Card",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},variant:{required:!1,tsType:{name:"union",raw:"'flat' | 'raised' | 'inset'",elements:[{name:"literal",value:"'flat'"},{name:"literal",value:"'raised'"},{name:"literal",value:"'inset'"}]},description:"",defaultValue:{value:"'flat'",computed:!1}},padding:{required:!1,tsType:{name:"union",raw:"'none' | 'compact' | 'default' | 'spacious'",elements:[{name:"literal",value:"'none'"},{name:"literal",value:"'compact'"},{name:"literal",value:"'default'"},{name:"literal",value:"'spacious'"}]},description:"",defaultValue:{value:"'default'",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}}}};y.__docgenInfo={description:"",methods:[],displayName:"CardHeader",props:{title:{required:!0,tsType:{name:"string"},description:""},subtitle:{required:!1,tsType:{name:"string"},description:""},actions:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:"''",computed:!1}}}};const j={title:"Design System/Card",component:h,tags:["autodocs"],argTypes:{variant:{control:"select",options:["flat","raised","inset"]},padding:{control:"select",options:["none","compact","default","spacious"]}}},r={args:{variant:"raised",padding:"default",children:e.jsxs(e.Fragment,{children:[e.jsx(y,{title:"Card title",subtitle:"Optional subtitle"}),e.jsx("p",{style:{margin:0,fontSize:"0.95rem",color:"var(--color-text-secondary)"},children:"Card body content. Use design system tokens for typography and spacing."})]})}},s={args:{variant:"flat",padding:"default",children:"Flat variant with default padding."}},n={args:{variant:"inset",padding:"compact",children:"Inset variant with compact padding."}};var o,l,c;r.parameters={...r.parameters,docs:{...(o=r.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    variant: "raised",
    padding: "default",
    children: <>
        <CardHeader title="Card title" subtitle="Optional subtitle" />
        <p style={{
        margin: 0,
        fontSize: "0.95rem",
        color: "var(--color-text-secondary)"
      }}>
          Card body content. Use design system tokens for typography and spacing.
        </p>
      </>
  }
}`,...(c=(l=r.parameters)==null?void 0:l.docs)==null?void 0:c.source}}};var p,u,m;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    variant: "flat",
    padding: "default",
    children: "Flat variant with default padding."
  }
}`,...(m=(u=s.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var f,g,v;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    variant: "inset",
    padding: "compact",
    children: "Inset variant with compact padding."
  }
}`,...(v=(g=n.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};const C=["Default","Flat","Inset"];export{r as Default,s as Flat,n as Inset,C as __namedExportsOrder,j as default};
