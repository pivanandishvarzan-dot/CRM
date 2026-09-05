import type { Config } from 'tailwindcss';

export default {
  content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme:{
    extend:{
      fontFamily:{sans:['var(--font-vazir)','Tahoma','Arial','sans-serif']},
      colors:{
        brand:{50:'#eef7f4',100:'#d8eee7',200:'#b5ddd0',300:'#84c5b3',400:'#4da78f',500:'#2f8b75',600:'#236f5e',700:'#1e594d',800:'#1b493f',900:'#183d36',950:'#0c221e'},
        ink:{50:'#f7f9f8',100:'#edf1ef',200:'#dce4e0',500:'#60716b',700:'#34433e',900:'#17211e'},
        accent:{50:'#fff8eb',100:'#feefc7',500:'#d79a2b',600:'#b87916'}
      },
      boxShadow:{soft:'0 10px 35px rgba(23,33,30,.07)',card:'0 18px 50px rgba(23,33,30,.08)',float:'0 20px 60px rgba(12,34,30,.16)'},
      borderRadius:{'3xl':'1.5rem'}
    }
  },
  plugins:[]
} satisfies Config;
