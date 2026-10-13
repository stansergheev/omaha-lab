// Omaha hand evaluator and Monte Carlo equity simulator. Cards are rank*4+suit (ranks 2..A = 0..12, suits ♣♦♥♠ = 0..3).
const RANKS='23456789TJQKA', SUIT_SYM=['♣','♦','♥','♠'];
const B1=16,B2=256,B3=4096,B4=65536,B5=1048576;
const CAT_NAMES=['Старшая карта','Пара','Две пары','Тройка','Стрит','Флеш','Фулл-хаус','Каре','Стрит-флеш'];
const STRAIGHT=new Int8Array(8192), POP=new Int8Array(8192);
for(let m=0;m<8192;m++){let ext=(m<<1)|((m>>12)&1),r=-1;for(let h=13;h>=4;h--){if(((ext>>(h-4))&31)===31){r=h-1;break;}}STRAIGHT[m]=r;let p=0,x=m;while(x){x&=x-1;p++;}POP[m]=p;}
function topBits(mask,n){let s=0,c=0;for(let r=12;r>=0&&c<n;r--){if((mask>>r)&1){s=s*16+r;c++;}}while(c<n){s*=16;c++;}return s;}
const _rc=new Int8Array(13),_sm=new Int32Array(4);
function evaluate(cards,n){
  let rm=0;_sm[0]=_sm[1]=_sm[2]=_sm[3]=0;
  for(let i=0;i<n;i++){const c=cards[i],r=c>>2;_rc[r]++;_sm[c&3]|=1<<r;rm|=1<<r;}
  let flush=-1;for(let s=0;s<4;s++){if(POP[_sm[s]]>=5){flush=_sm[s];break;}}
  let quad=-1,t1=-1,t2=-1,p1=-1,p2=-1;
  for(let r=12;r>=0;r--){const k=_rc[r];if(!k)continue;_rc[r]=0;
    if(k===4)quad=r;else if(k===3){if(t1<0)t1=r;else if(t2<0)t2=r;}else if(k===2){if(p1<0)p1=r;else if(p2<0)p2=r;}}
  if(flush>=0){const sf=STRAIGHT[flush];if(sf>=0)return 8*B5+sf*B4;}
  if(quad>=0)return 7*B5+quad*B4+topBits(rm&~(1<<quad),1)*B3;
  if(t1>=0&&(t2>=0||p1>=0))return 6*B5+t1*B4+Math.max(t2,p1)*B3;
  if(flush>=0)return 5*B5+topBits(flush,5);
  const st=STRAIGHT[rm];if(st>=0)return 4*B5+st*B4;
  if(t1>=0)return 3*B5+t1*B4+topBits(rm&~(1<<t1),2)*B2;
  if(p2>=0)return 2*B5+p1*B4+p2*B3+topBits(rm&~(1<<p1)&~(1<<p2),1)*B2;
  if(p1>=0)return B5+p1*B4+topBits(rm&~(1<<p1),3)*B1;
  return topBits(rm,5);
}
const _b5=new Int32Array(5);
function evalOmaha(h,hn,b,bn){let best=-1;
  for(let i=0;i<hn-1;i++)for(let j=i+1;j<hn;j++){_b5[0]=h[i];_b5[1]=h[j];
    for(let k=0;k<bn-2;k++)for(let l=k+1;l<bn-1;l++)for(let m=l+1;m<bn;m++){_b5[2]=b[k];_b5[3]=b[l];_b5[4]=b[m];const s=evaluate(_b5,5);if(s>best)best=s;}}
  return best;}
function ploScore(h){let s=0;const sc=[0,0,0,0],rc=new Int8Array(13);
  for(let i=0;i<4;i++){sc[h[i]&3]++;rc[h[i]>>2]++;}
  for(let i=0;i<3;i++)for(let j=i+1;j<4;j++){let a=h[i]>>2,b=h[j]>>2;if(b>a){const t=a;a=b;b=t;}
    if(a===b)s+=6+a;else{s+=(a+b)/6;const g=a-b;if(g<=3)s+=(4-g)*0.9;if(a===12&&b<=3)s+=0.5;
      if((h[i]&3)===(h[j]&3))s+=1+a/6+(a===12?1.5:0);}}
  const pat=sc.slice().sort((x,y)=>y-x);
  if(pat[0]===2&&pat[1]===2)s+=2;else if(pat[0]===3)s-=1.5;else if(pat[0]===4)s-=4;
  for(let r=0;r<13;r++)if(rc[r]>=3)s-=10;
  return s;}
function makeRng(seed){let x=(seed>>>0)||123456789;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
function newAcc(){return{n:0,win:0,tie:0,eq:0,cat:new Float64Array(9),catEq:new Float64Array(9),lossBy:new Float64Array(9)};}
function simulate(hero,board,nOpp,minScore,iters,rng,acc){
  const used=new Uint8Array(52);hero.forEach(c=>used[c]=1);board.forEach(c=>used[c]=1);
  const deck=[];for(let c=0;c<52;c++)if(!used[c])deck.push(c);
  const L=deck.length,nb=board.length,need=5-nb;
  const brd=new Int32Array(5),opp=new Int32Array(nOpp*4),oh=new Int32Array(4),hh=new Int32Array(hero);
  for(let i=0;i<nb;i++)brd[i]=board[i];
  let top;const draw=()=>{const j=(rng()*top)|0,c=deck[j];deck[j]=deck[top-1];deck[top-1]=c;top--;return c;};
  for(let it=0;it<iters;it++){
    top=L;
    for(let o=0;o<nOpp;o++){let tries=0;for(;;){for(let q=0;q<4;q++)oh[q]=draw();
      if(minScore==null||++tries>300||ploScore(oh)>=minScore){for(let q=0;q<4;q++)opp[4*o+q]=oh[q];break;}top+=4;}}
    for(let k=0;k<need;k++)brd[nb+k]=draw();
    const hs=evalOmaha(hh,4,brd,5);let ties=0,best=-1;
    for(let o=0;o<nOpp;o++){for(let q=0;q<4;q++)oh[q]=opp[4*o+q];const s=evalOmaha(oh,4,brd,5);if(s>best)best=s;if(s===hs)ties++;}
    const cat=(hs/B5)|0;acc.n++;acc.cat[cat]++;
    if(best>hs)acc.lossBy[(best/B5)|0]++;
    else if(ties>0){acc.tie++;const e=1/(ties+1);acc.eq+=e;acc.catEq[cat]+=e;}
    else{acc.win++;acc.eq+=1;acc.catEq[cat]+=1;}
  }
  return acc;}
