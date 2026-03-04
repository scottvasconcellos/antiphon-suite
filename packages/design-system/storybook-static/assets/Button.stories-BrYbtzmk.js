import{j as o}from"./jsx-runtime-Cf8x2fCZ.js";import{r as u}from"./index-BioFo8Zg.js";import"./index-yBjzXJbu.js";const t=({variant:j="secondary",size:R="default",className:T="",children:k,disabled:O,toggle:v=!1,onClick:i,...P})=>{const[p,q]=u.useState(!1),[N,m]=u.useState(!1),d=u.useRef(),I=W=>{v?q(!p):(m(!0),d.current&&clearTimeout(d.current),d.current=setTimeout(()=>m(!1),150)),i==null||i(W)},e=v?p:N,V=`
    inline-flex items-center justify-center gap-2
    font-medium
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
    border select-none
    transition-[background-color,border-color,color,box-shadow,transform] duration-100 ease-out
  `,a="shadow-[0_1px_0_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3)]",r="shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(0,0,0,0.15)]",D={primary:`
      bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]
      border-[var(--color-accent-primary)]
      hover:bg-[var(--color-accent-primary-hover)]
      active:bg-[var(--color-accent-primary-active)]
      focus-visible:outline-[var(--color-accent-primary)]
      ${e?r:a}
    `,default:`
      bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]
      border-[var(--color-accent-primary)]
      hover:bg-[var(--color-accent-primary-hover)]
      active:bg-[var(--color-accent-primary-active)]
      focus-visible:outline-[var(--color-accent-primary)]
      ${e?r:a}
    `,secondary:`
      bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-primary)]
      border-[var(--color-border-strong)]
      hover:brightness-110 hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]
      active:brightness-95
      focus-visible:outline-[var(--color-border-focus)]
      ${e?r:a}
    `,outline:`
      bg-transparent text-[var(--color-text-primary)]
      border-[var(--color-border-strong)]
      hover:bg-[var(--color-overlay-hover)]
      active:bg-[var(--color-overlay-active)]
      focus-visible:outline-[var(--color-border-focus)]
      ${e?r:""}
    `,destructive:`
      bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-secondary)]
      border-[var(--color-border-strong)]
      hover:bg-[var(--color-accent-danger)]/15 hover:text-[var(--color-accent-danger)] hover:border-[var(--color-accent-danger)]
      active:bg-[var(--color-accent-danger)]/25
      focus-visible:outline-[var(--color-accent-danger)]
      ${e?r:a}
    `,link:`
      bg-transparent text-[var(--color-text-link)]
      border-transparent
      hover:text-[var(--color-accent-primary-hover)] underline
      active:text-[var(--color-accent-primary-active)]
      focus-visible:outline-[var(--color-border-focus)]
    `,ghost:`
      bg-transparent text-[var(--color-text-secondary)]
      border-transparent
      hover:bg-[var(--color-overlay-hover)] hover:text-[var(--color-text-primary)]
      active:bg-[var(--color-overlay-active)]
      focus-visible:outline-[var(--color-border-focus)]
      ${e?"shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]":""}
    `,danger:`
      bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-secondary)]
      border-[var(--color-border-strong)]
      hover:bg-[var(--color-accent-danger)]/15 hover:text-[var(--color-accent-danger)] hover:border-[var(--color-accent-danger)]
      active:bg-[var(--color-accent-danger)]/25
      focus-visible:outline-[var(--color-accent-danger)]
      ${e?r:a}
    `,illuminated:`
      text-white border-[#8b1a1a]
      focus-visible:outline-[var(--color-accent-danger)]
      ${e?"bg-[#dc2626] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),0_0_16px_rgba(220,38,38,0.6),0_0_4px_rgba(220,38,38,0.8)] border-[#ef4444]":"bg-[#7f1d1d] shadow-[0_1px_0_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.4),0_0_8px_rgba(127,29,29,0.3)] hover:bg-[#991b1b] hover:shadow-[0_0_12px_rgba(220,38,38,0.4)]"}
    `},E={compact:"px-3 py-1.5 text-xs rounded-[var(--radius-sm)]",default:"px-4 py-2 text-sm rounded-[var(--radius-md)]",spacious:"px-6 py-3 text-base rounded-[var(--radius-lg)]",sm:"px-3 py-1.5 text-xs rounded-[var(--radius-sm)]",lg:"px-6 py-3 text-base rounded-[var(--radius-lg)]",icon:"p-2 rounded-[var(--radius-md)]"};return o.jsx("button",{className:`${V} ${D[j]} ${E[R]} ${T}`,disabled:O,onClick:I,...P,children:k})};t.__docgenInfo={description:"",methods:[],displayName:"Button",props:{variant:{required:!1,tsType:{name:"union",raw:"'primary' | 'secondary' | 'ghost' | 'danger' | 'illuminated' | 'outline' | 'default' | 'destructive' | 'link'",elements:[{name:"literal",value:"'primary'"},{name:"literal",value:"'secondary'"},{name:"literal",value:"'ghost'"},{name:"literal",value:"'danger'"},{name:"literal",value:"'illuminated'"},{name:"literal",value:"'outline'"},{name:"literal",value:"'default'"},{name:"literal",value:"'destructive'"},{name:"literal",value:"'link'"}]},description:"",defaultValue:{value:"'secondary'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'compact' | 'default' | 'spacious' | 'sm' | 'lg' | 'icon'",elements:[{name:"literal",value:"'compact'"},{name:"literal",value:"'default'"},{name:"literal",value:"'spacious'"},{name:"literal",value:"'sm'"},{name:"literal",value:"'lg'"},{name:"literal",value:"'icon'"}]},description:"",defaultValue:{value:"'default'",computed:!1}},toggle:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{defaultValue:{value:"''",computed:!1},required:!1}}};const G={title:"Design System/Button",component:t,tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","secondary","ghost","danger","outline","link"]},size:{control:"select",options:["compact","default","spacious"]}}},n={args:{variant:"primary",children:"Primary"}},c={args:{variant:"secondary",children:"Secondary"}},s={args:{variant:"outline",children:"Outline"}},l={render:()=>o.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"},children:[o.jsx(t,{size:"compact",children:"Compact"}),o.jsx(t,{size:"default",children:"Default"}),o.jsx(t,{size:"spacious",children:"Spacious"})]})};var b,g,x;n.parameters={...n.parameters,docs:{...(b=n.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    variant: "primary",
    children: "Primary"
  }
}`,...(x=(g=n.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var f,y,_;c.parameters={...c.parameters,docs:{...(f=c.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    variant: "secondary",
    children: "Secondary"
  }
}`,...(_=(y=c.parameters)==null?void 0:y.docs)==null?void 0:_.source}}};var h,S,w;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    variant: "outline",
    children: "Outline"
  }
}`,...(w=(S=s.parameters)==null?void 0:S.docs)==null?void 0:w.source}}};var $,z,B;l.parameters={...l.parameters,docs:{...($=l.parameters)==null?void 0:$.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center"
  }}>
      <Button size="compact">Compact</Button>
      <Button size="default">Default</Button>
      <Button size="spacious">Spacious</Button>
    </div>
}`,...(B=(z=l.parameters)==null?void 0:z.docs)==null?void 0:B.source}}};const H=["Primary","Secondary","Outline","Sizes"];export{s as Outline,n as Primary,c as Secondary,l as Sizes,H as __namedExportsOrder,G as default};
