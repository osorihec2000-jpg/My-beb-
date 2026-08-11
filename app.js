const KEY='miBebeData_v3';
const baby={name:'Liam',birth:'2026-06-09'};

let data=JSON.parse(localStorage.getItem(KEY)||'{"records":[],"photo":"","appointments":[],"nextFeed":null}');
data.records=data.records||[];
data.appointments=data.appointments||[];
data.nextFeed=data.nextFeed||null;

const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
const fmtTime=t=>new Date(t).toLocaleTimeString('es-US',{hour:'numeric',minute:'2-digit'});

function save(){
  localStorage.setItem(KEY,JSON.stringify(data));
  render();
}

function exactAge(){
  const birth=new Date('2026-06-09T00:00:00');
  const now=new Date();

  let years=now.getFullYear()-birth.getFullYear();
  let months=now.getMonth()-birth.getMonth();
  let days=now.getDate()-birth.getDate();

  if(days<0){
    months--;
    days+=new Date(now.getFullYear(),now.getMonth(),0).getDate();
  }

  if(months<0){
    years--;
    months+=12;
  }

  const base=new Date(birth);
  base.setFullYear(birth.getFullYear()+years);
  base.setMonth(birth.getMonth()+months);
  base.setDate(base.getDate()+days);

  let remaining=now-base;

  const hours=Math.floor(remaining/3600000);
  remaining%=3600000;

  const minutes=Math.floor(remaining/60000);
  remaining%=60000;

  const seconds=Math.floor(remaining/1000);
  const milliseconds=remaining%1000;

  return {
    years,months,days,hours,minutes,seconds,milliseconds
  };
}

function ageText(){
  const a=exactAge();

  return `${a.years} ${a.years===1?'año':'años'} · `+
    `${a.months} ${a.months===1?'mes':'meses'} · `+
    `${a.days} ${a.days===1?'día':'días'} · `+
    `${a.hours} ${a.hours===1?'hora':'horas'} · `+
    `${a.minutes} ${a.minutes===1?'minuto':'minutos'} · `+
    `${a.seconds} ${a.seconds===1?'segundo':'segundos'} · `+
    `${String(a.milliseconds).padStart(3,'0')} milésimas`;
}

function nextCumplemes(){

  const now=new Date();

  let d=new Date(
    now.getFullYear(),
    now.getMonth(),
    9,
    9,0,0
  );

  if(d<=now){
    d=new Date(
      now.getFullYear(),
      now.getMonth()+1,
      9,
      9,0,0
    );
  }

  return d;
}

function nextBirthday(){

  const now=new Date();

  let d=new Date(
    now.getFullYear(),
    5,
    9,
    9,0,0
  );

  if(d<=now){
    d=new Date(
      now.getFullYear()+1,
      5,
      9,
      9,0,0
    );
  }

  return d;
}

function reminderText(){

  const cm=nextCumplemes();
  const bd=nextBirthday();

  let text=
    `🩵 Próximo cumplemes: ${cm.toLocaleDateString('es-US',{month:'long',day:'numeric'})}`;

  if(data.nextFeed){
    const f=new Date(data.nextFeed);

    if(f>new Date()){
      text+=
        ` · 🍼 Próxima toma: ${fmtTime(f)}`;
    }
  }

  return text;
}

function requestNotifications(){

  if(!('Notification' in window)){
    toast('Este dispositivo no permite notificaciones web aquí');
    return;
  }

  Notification.requestPermission().then(p=>{

    if(p==='granted'){
      toast('🔔 Notificaciones activadas');
      checkReminders();
    }else{
      toast('Las notificaciones no fueron activadas');
    }

  });
}

function sendNotification(title,body){

  if(
    'Notification' in window &&
    Notification.permission==='granted'
  ){
    try{
      new Notification(title,{body});
    }catch(e){}
  }
}

function checkReminders(){

  const now=Date.now();

  if(data.nextFeed){

    const feedTime=new Date(data.nextFeed).getTime();

    if(
      now>=feedTime &&
      now<feedTime+60000
    ){

      sendNotification(
        '🍼 Hora de la toma de Liam 🩵',
        'Han pasado 3 horas desde la última toma.'
      );

      data.nextFeed=null;
      localStorage.setItem(KEY,JSON.stringify(data));
      render();
    }
  }

  const nowDate=new Date();

  if(
    nowDate.getDate()===9 &&
    nowDate.getHours()===9 &&
    nowDate.getMinutes()===0
  ){

    const key=
      'cumplemes_'+
      nowDate.getFullYear()+'_'+
      nowDate.getMonth();

    if(localStorage.getItem(key)!=='yes'){

      sendNotification(
        '🩵 Cumplemes de Liam',
        '¡Hoy Liam cumple un mes más de vida! 🎉'
      );

      localStorage.setItem(key,'yes');
    }
  }

  if(
    nowDate.getMonth()===5 &&
    nowDate.getDate()===9 &&
    nowDate.getHours()===9 &&
    nowDate.getMinutes()===0
  ){

    const key='birthday_'+nowDate.getFullYear();

    if(localStorage.getItem(key)!=='yes'){

      sendNotification(
        '🎂 ¡Feliz cumpleaños, Liam 🩵!',
        'Hoy Liam cumple años. 🎉'
      );

      localStorage.setItem(key,'yes');
    }
  }
}

function scheduleNextFeed(){

  const next=Date.now()+3*60*60*1000;

  data.nextFeed=next;

  save();

  requestNotifications();

  toast(
    `🍼 Próxima toma: ${fmtTime(next)}`
  );
}

function render(){

  $('#babyAge').textContent=ageText();

  const n=new Date();

  $('#todayLabel').textContent=
    n.toLocaleDateString('es-US',{
      weekday:'long',
      month:'long'
    });

  $('#dayNumber').textContent=n.getDate();

  const reminder=$('#reminderInfo');

  if(reminder){
    reminder.textContent=reminderText();
  }

  const r=data.records.filter(x=>x.date===today());

  const f=r.filter(x=>x.type==='feeding');
  const s=r.filter(x=>x.type==='sleep');
  const d=r.filter(x=>x.type==='diaper');

  const g=data.records
    .filter(x=>x.type==='growth')
    .sort((a,b)=>b.ts-a.ts)[0];

  $('#feedSummary').textContent=
    f.length?
    `${f.length} registro${f.length>1?'s':''}`:
    'Sin registros';

  $('#sleepSummary').textContent=
    s.length?
    `${s.length} registro${s.length>1?'s':''}`:
    'Sin registros';

  $('#diaperSummary').textContent=`${d.length} hoy`;

  $('#weightSummary').textContent=
    g?`${g.weight} lb`:'Sin registros';

  const recent=[...data.records]
    .sort((a,b)=>b.ts-a.ts)
    .slice(0,8);

  $('#recentList').innerHTML=
    recent.length?

    recent.map(x=>`
      <div class="record">
        <div class="record-main">
          <div class="record-icon">
            ${icon(x.type)}
          </div>

          <div>
            <strong>${title(x.type)}</strong><br>
            <small>
              ${x.detail} · ${fmtTime(x.ts)}
            </small>
          </div>
        </div>

        <button
          class="link"
          data-delete="${x.id}">
          Eliminar
        </button>
      </div>
    `).join(''):

    '<div class="empty">Aún no hay registros.<br>Presiona “Registrar actividad” para comenzar.</div>';

  document.querySelectorAll('[data-delete]')
    .forEach(b=>{

      b.onclick=()=>{

        data.records=data.records.filter(
          x=>x.id!==b.dataset.delete
        );

        save();

        toast('Registro eliminado');
      };

    });

  if(data.photo){

    $('#photoBtn').style.backgroundImage=
      `url(${data.photo})`;

    $('#photoBtn').style.backgroundSize='cover';
    $('#photoBtn').textContent='';
  }
}

const icon=t=>({
  feeding:'🍼',
  sleep:'😴',
  diaper:'🧷',
  growth:'⚖️',
  diary:'📖',
  activity:'✨',
  appointment:'🏥'
}[t]||'📝');

const title=t=>({
  feeding:'Alimentación',
  sleep:'Sueño',
  diaper:'Pañal',
  growth:'Peso',
  diary:'Diario',
  activity:'Actividad',
  appointment:'Cita médica'
}[t]||'Registro');

function openModal(kind){

  let html='';

  if(kind==='menu'){

    html=`
      <h2>Más</h2>

      <div class="menu">

        <button data-action="notifications">
          🔔 Activar notificaciones
        </button>

        <button data-action="appointments">
          🏥 Citas médicas
        </button>

        <button data-action="export">
          📤 Exportar mis registros
        </button>

        <button data-action="clear">
          🗑️ Borrar todos los registros
        </button>

        <button data-action="photo">
          👶 Cambiar foto de Liam 🩵
        </button>

      </div>
    `;

  }else if(kind==='appointments'){

    html=`
      <h2>🏥 Citas médicas</h2>

      <button class="primary" id="newAppointment">
        ＋ Nueva cita
      </button>

      <div class="list">

        ${
          [...data.appointments]
          .sort((a,b)=>
            (a.date+a.time).localeCompare(b.date+b.time)
          )
          .map(x=>`

            <div class="record">

              <div>

                <strong>
                  🏥 ${x.hospital}
                </strong>

                <br>

                <small>
                  📅 ${formatDate(x.date)}
                  ${x.time?' · ⏰ '+x.time:''}
                </small>

                ${
                  x.note?
                  `<br><small>${x.note}</small>`:
                  ''
                }

              </div>

              <button
                class="link"
                data-appt-delete="${x.id}">
                Eliminar
              </button>

            </div>

          `).join('')||

          '<div class="empty">No hay citas médicas guardadas.</div>'
        }

      </div>
    `;

  }else if(kind==='newAppointment'){

    html=`
      <h2>🏥 Nueva cita médica</h2>

      <form class="form" id="form">

        <label>
          Hospital

          <input
            name="hospital"
            required
            placeholder="Nombre del hospital">
        </label>

        <label>
          Fecha

          <input
            name="date"
            type="date"
            required>
        </label>

        <label>
          Hora

          <input
            name="time"
            type="time">
        </label>

        <label>
          Motivo o notas

          <textarea
            name="note"
            placeholder="Motivo de la cita o notas...">
          </textarea>
        </label>

        <div class="actions">

          <button
            type="button"
            class="btn"
            data-close>
            Cancelar
          </button>

          <button class="btn primary-btn">
            Guardar cita
          </button>

        </div>

      </form>
    `;

  }else if(kind==='feeding'){

    html=`
      <h2>🍼 Alimentación</h2>

      <form class="form" id="form">

        <label>
          Tipo

          <select name="detail">
            <option>Fórmula</option>
            <option>Leche materna</option>
            <option>Comida</option>
            <option>Otro</option>
          </select>
        </label>

        <label>
          Cantidad (oz)

          <input
            name="amount"
            type="number"
            min="0"
            step="0.5"
            placeholder="Ej. 2">
        </label>

        <div class="actions">

          <button
            type="button"
            class="btn"
            data-close>
            Cancelar
          </button>

          <button class="btn primary-btn">
            Guardar
          </button>

        </div>

      </form>
    `;

  }else if(kind==='sleep'){

    html=`
      <h2>😴 Sueño</h2>

      <form class="form" id="form">

        <label>
          Duración (minutos)

          <input
            name="duration"
            type="number"
            min="1"
            placeholder="Ej. 90"
            required>
        </label>

        <label>
          Nota

          <textarea
            name="note"
            placeholder="Cómo durmió…">
          </textarea>
        </label>

        <div class="actions">

          <button
            type="button"
            class="btn"
            data-close>
            Cancelar
          </button>

          <button class="btn primary-btn">
            Guardar
          </button>

        </div>

      </form>
    `;

  }else if(kind==='diaper'){

    html=`
      <h2>🧷 Pañal</h2>

      <form class="form" id="form">

        <label>
          Tipo

          <select name="detail">
            <option>Orina</option>
            <option>Popó</option>
            <option>Orina y popó</option>
          </select>
        </label>

        <div class="actions">

          <button
            type="button"
            class="btn"
            data-close>
            Cancelar
          </button>

          <button class="btn primary-btn">
            Guardar
          </button>

        </div>

      </form>
    `;

  }else if(kind==='growth'){

    html=`
      <h2>⚖️ Crecimiento</h2>

      <form class="form" id="form">

        <label>
          Peso (lb)

          <input
            name="weight"
            type="number"
            min="0"
            step="0.1"
            required>
        </label>

        <label>
          Estatura (cm)

          <input
            name="height"
            type="number"
            min="0"
            step="0.1">
        </label>

        <div class="actions">

          <button
            type="button"
            class="btn"
            data-close>
            Cancelar
          </button>

          <button class="btn primary-btn">
            Guardar
          </button>

        </div>

      </form>
    `;

  }else if(kind==='diary'){

    html=`
      <h2>♡ Diario</h2>

      <form class="form" id="form">

        <label>
          Escribe una nota

          <textarea
            name="note"
            required
            placeholder="Un momento especial de Liam 🩵…">
          </textarea>

        </label>

        <div class="actions">

          <button
            type="button"
            class="btn"
            data-close>
            Cancelar
          </button>

          <button class="btn primary-btn">
            Guardar
          </button>

        </div>

      </form>
    `;

  }else if(kind==='activity'){

    html=`
      <h2>✨ Actividad</h2>

      <form class="form" id="form">

        <label>
          Actividad

          <input
            name="detail"
            required
            placeholder="Ej. Sonrió, jugó, paseó…">
        </label>

        <div class="actions">

          <button
            type="button"
            class="btn"
            data-close>
            Cancelar
          </button>

          <button class="btn primary-btn">
            Guardar
          </button>

        </div>

      </form>
    `;

  }else if(kind==='all'){

    html=`
      <h2>Todos los registros</h2>

      <div class="list">

        ${
          [...data.records]
          .sort((a,b)=>b.ts-a.ts)
          .map(x=>`

            <div class="record">

              <div>

                <strong>
                  ${icon(x.type)} ${title(x.type)}
                </strong>

                <br>

                <small>
                  ${x.detail} ·
                  ${new Date(x.ts).toLocaleString('es-US')}
                </small>

              </div>

            </div>

          `).join('')||

          '<div class="empty">No hay registros.</div>'
        }

      </div>
    `;
  }

  $('#modalContent').innerHTML=html;
  $('#modal').hidden=false;

  document.querySelectorAll('[data-close]')
    .forEach(b=>b.onclick=closeModal);

  const form=$('#modalContent form');

  if(form){

    form.onsubmit=e=>{

      e.preventDefault();

      const fd=new FormData(form);
      const o=Object.fromEntries(fd);

      if(kind==='newAppointment'){

        data.appointments.push({
          id:crypto.randomUUID(),
          hospital:o.hospital,
          date:o.date,
          time:o.time,
          note:o.note,
          ts:Date.now()
        });

        save();
        closeModal();
        toast('Cita médica guardada');

        return;
      }

      let detail=o.detail||o.note||'';

      if(kind==='feeding'&&o.amount)
        detail+=` · ${o.amount} oz`;

      if(kind==='sleep')
        detail=`${o.duration} min${o.note?' · '+o.note:''}`;

      if(kind==='growth')
        detail=`${o.weight} lb${o.height?' · '+o.height+' cm':''}`;

      data.records.push({
        id:crypto.randomUUID(),
        type:kind,
        detail,
        date:today(),
        ts:Date.now(),
        weight:o.weight||null
      });

      save();

      if(kind==='feeding'){
        scheduleNextFeed();
      }

      closeModal();

      toast('Guardado correctamente');
    };
  }

  $('#newAppointment')?.addEventListener(
    'click',
    ()=>openModal('newAppointment')
  );

  document.querySelectorAll('[data-appt-delete]')
    .forEach(b=>{

      b.onclick=()=>{

        data.appointments=data.appointments.filter(
          x=>x.id!==b.dataset.apptDelete
        );

        save();

        openModal('appointments');

        toast('Cita eliminada');
      };

    });

  document.querySelector('[data-action="notifications"]')
    ?.addEventListener(
      'click',
      requestNotifications
    );

  document.querySelector('[data-action="appointments"]')
    ?.addEventListener(
      'click',
      ()=>openModal('appointments')
    );

  document.querySelector('[data-action="export"]')
    ?.addEventListener(
      'click',
      exportData
    );

  document.querySelector('[data-action="clear"]')
    ?.addEventListener(
      'click',
      ()=>{

        if(confirm('¿Borrar todos los registros?')){

          data.records=[];
          data.nextFeed=null;

          save();

          closeModal();

          toast('Registros borrados');
        }

      }
    );

  document.querySelector('[data-action="photo"]')
    ?.addEventListener(
      'click',
      ()=>{
        $('#photoInput').click();
        closeModal();
      }
    );
}

function formatDate(date){

  if(!date)return '';

  return new Date(date+'T12:00:00')
    .toLocaleDateString('es-US',{
      weekday:'short',
      month:'long',
      day:'numeric',
      year:'numeric'
    });
}

function closeModal(){
  $('#modal').hidden=true;
}

function toast(t){

  const x=document.createElement('div');

  x.className='toast';
  x.textContent=t;

  document.body.append(x);

  setTimeout(
    ()=>x.remove(),
    1800
  );
}

function exportData(){

  const blob=new Blob(
    [JSON.stringify({baby,data},null,2)],
    {type:'application/json'}
  );

  const a=document.createElement('a');

  a.href=URL.createObjectURL(blob);
  a.download='liam-registros.json';

  a.click();

  URL.revokeObjectURL(a.href);

  toast('Archivo exportado');
}

$('#quickAdd').onclick=()=>openModal('activity');

document.querySelectorAll('[data-open]')
  .forEach(x=>
    x.onclick=()=>openModal(x.dataset.open)
  );

$('#viewAll').onclick=()=>openModal('all');

$('#closeModal').onclick=closeModal;

$('#modal').onclick=e=>{
  if(e.target.id==='modal')
    closeModal();
};

document.querySelectorAll('.nav')
  .forEach(b=>{

    b.onclick=()=>{

      document.querySelectorAll('.nav')
        .forEach(n=>n.classList.remove('active'));

      b.classList.add('active');

      const t=b.dataset.tab;

      if(t==='activity')
        openModal('activity');

      else if(t==='growth')
        openModal('growth');

      else if(t==='diary')
        openModal('diary');

      else if(t==='more')
        openModal('menu');
    };

  });

$('#photoBtn').onclick=()=>$('#photoInput').click();

$('#photoInput').onchange=e=>{

  const f=e.target.files[0];

  if(!f)return;

  const rd=new FileReader();

  rd.onload=()=>{

    data.photo=rd.result;

    save();

    toast('Foto guardada');
  };

  rd.readAsDataURL(f);
};

render();

setInterval(()=>{

  const el=$('#babyAge');

  if(el)
    el.textContent=ageText();

  checkReminders();

},1000);
