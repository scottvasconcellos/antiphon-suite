import{j as e}from"./jsx-runtime-Cf8x2fCZ.js";import{K as a}from"./Knob-54uTBRoU.js";import"./index-yBjzXJbu.js";import"./index-BioFo8Zg.js";const j={title:"Design System/Audio/Knob",component:a,tags:["autodocs"],parameters:{layout:"padded"},argTypes:{size:{control:"select",options:["small","medium","large"]},min:{control:"number"},max:{control:"number"},defaultValue:{control:"number"},disabled:{control:"boolean"}}},l={args:{label:"GAIN",defaultValue:50,min:0,max:100,unit:"%",size:"medium"}},n={args:{label:"PAN",defaultValue:0,min:-100,max:100,unit:"%",size:"small"}},s={args:{label:"VOLUME",defaultValue:80,min:0,max:100,unit:" dB",size:"large"}},m={render:()=>e.jsxs("div",{style:{display:"flex",gap:24,flexWrap:"wrap",alignItems:"flex-end"},children:[e.jsx(a,{label:"CUTOFF",defaultValue:8e3,min:20,max:2e4,unit:" Hz",size:"medium"}),e.jsx(a,{label:"RES",defaultValue:30,min:0,max:100,unit:"%",size:"medium"}),e.jsx(a,{label:"A",defaultValue:10,min:0,max:100,unit:" ms",size:"small"}),e.jsx(a,{label:"D",defaultValue:30,min:0,max:100,unit:" ms",size:"small"}),e.jsx(a,{label:"S",defaultValue:70,min:0,max:100,unit:"%",size:"small"}),e.jsx(a,{label:"R",defaultValue:40,min:0,max:100,unit:" ms",size:"small"})]})};var r,t,i;l.parameters={...l.parameters,docs:{...(r=l.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    label: "GAIN",
    defaultValue: 50,
    min: 0,
    max: 100,
    unit: "%",
    size: "medium"
  }
}`,...(i=(t=l.parameters)==null?void 0:t.docs)==null?void 0:i.source}}};var u,o,d;n.parameters={...n.parameters,docs:{...(u=n.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    label: "PAN",
    defaultValue: 0,
    min: -100,
    max: 100,
    unit: "%",
    size: "small"
  }
}`,...(d=(o=n.parameters)==null?void 0:o.docs)==null?void 0:d.source}}};var c,p,x;s.parameters={...s.parameters,docs:{...(c=s.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    label: "VOLUME",
    defaultValue: 80,
    min: 0,
    max: 100,
    unit: " dB",
    size: "large"
  }
}`,...(x=(p=s.parameters)==null?void 0:p.docs)==null?void 0:x.source}}};var b,f,g;m.parameters={...m.parameters,docs:{...(b=m.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    alignItems: "flex-end"
  }}>
      <Knob label="CUTOFF" defaultValue={8000} min={20} max={20000} unit=" Hz" size="medium" />
      <Knob label="RES" defaultValue={30} min={0} max={100} unit="%" size="medium" />
      <Knob label="A" defaultValue={10} min={0} max={100} unit=" ms" size="small" />
      <Knob label="D" defaultValue={30} min={0} max={100} unit=" ms" size="small" />
      <Knob label="S" defaultValue={70} min={0} max={100} unit="%" size="small" />
      <Knob label="R" defaultValue={40} min={0} max={100} unit=" ms" size="small" />
    </div>
}`,...(g=(f=m.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};const y=["Default","Small","Large","RowOfKnobs"];export{l as Default,s as Large,m as RowOfKnobs,n as Small,y as __namedExportsOrder,j as default};
