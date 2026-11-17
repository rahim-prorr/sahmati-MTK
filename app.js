(() => {
  'use strict';
  const STORAGE_KEY = 'chess-project-players-v1';
  const SAVED_GAMES_KEY = 'chess-project-saved-games-v1';
  const SCORED_GAMES_KEY = 'chess-project-scored-games-v1';
  const $ = (selector) => document.querySelector(selector);
  const PIECES = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  };
  const PIECE_NAMES = { k: 'король', q: 'ферзь', r: 'ладья', b: 'слон', n: 'конь', p: 'пешка' };
  const FILES = 'abcdefgh';
  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const loadPlayers = () => {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const savePlayers = (players) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); } catch {} };
  const loadScoredGames = () => { try { const value = JSON.parse(localStorage.getItem(SCORED_GAMES_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const markScoredGame = (id) => { try { const ids = loadScoredGames(); if (!ids.includes(id)) { ids.push(id); localStorage.setItem(SCORED_GAMES_KEY, JSON.stringify(ids.slice(-500))); } } catch {} };
  const applyGameScore = (id, result, whiteId, blackId) => {
    if (!id || loadScoredGames().includes(id) || !whiteId || !blackId || whiteId === blackId || result === '½-½') return;
    const players = loadPlayers(); const white = players.find(p => p.id === whiteId); const black = players.find(p => p.id === blackId);
    if (!white || !black) return;
    if (result === '1-0') { white.rating = (Number(white.rating) || 0) + 100; black.rating = Math.max(0, (Number(black.rating) || 0) - 20); }
    else if (result === '0-1') { black.rating = (Number(black.rating) || 0) + 100; white.rating = Math.max(0, (Number(white.rating) || 0) - 20); }
    else return;
    savePlayers(players); markScoredGame(id);
  };
  const loadSavedGames = () => { try { const value = JSON.parse(localStorage.getItem(SAVED_GAMES_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const saveSavedGames = (games) => { try { localStorage.setItem(SAVED_GAMES_KEY, JSON.stringify(games)); return true; } catch { return false; } };
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const renderPlayers = () => {
    const players = loadPlayers();
    const list = $('#playersList');
    if (list) list.innerHTML = players.length ? [...players].sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)).map((p, i) => `<article class="player-card"><div class="photo-placeholder" aria-label="Место для фотографии игрока"><span>＋</span><small>Фото игрока</small></div><div class="place">${i + 1}</div><div class="name">${escapeHTML(p.name)}</div><div class="rating">${Number(p.rating)||0} очков</div><button class="btn-secondary" data-delete="${escapeHTML(p.id)}" type="button">Удалить</button></article>`).join('') : '<p class="empty">Пока игроков нет. Добавь первого игрока выше.</p>';
    ['#whitePlayer', '#blackPlayer'].forEach((selector) => {
      const select = $(selector); if (!select) return;
      const previous = select.value;
      select.innerHTML = '<option value="">— выберите игрока —</option>' + players.map(p => `<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join('');
      if (players.some(p => p.id === previous)) select.value = previous;
    });
    const top = $('#top3Container');
    if (top) top.innerHTML = players.length ? [...players].sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)).slice(0,3).map((p,i)=>`<article class="player-card"><div class="photo-placeholder photo-small" aria-label="Место для фотографии игрока"><span>＋</span></div><div class="place">${['🥇','🥈','🥉'][i]}</div><div class="name">${escapeHTML(p.name)}</div><div class="rating">${Number(p.rating)||0} очков</div></article>`).join('') : '<p class="empty">Пока нет игроков. Добавьте игроков на странице «Игроки».</p>';
  };
  const renderSavedGames = () => {
    const list = $('#savedGamesList');
    if (!list) return;
    const games = loadSavedGames().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!games.length) {
      list.innerHTML = '<div class="empty-state"><span class="empty-state-icon">♟</span><strong>Пока нет сохранённых партий</strong><p>Во время игры нажми «Сохранить партию», чтобы продолжить позже.</p></div>';
      return;
    }
    const isGamePage = !!$('#board');
    list.innerHTML = games.map(game => `<article class="saved-game-card"><div class="saved-game-icon">♟</div><div class="saved-game-info"><strong>${escapeHTML(game.whiteName || 'Белые')} <span>—</span> ${escapeHTML(game.blackName || 'Чёрные')}</strong><small>${new Date(game.updatedAt || Date.now()).toLocaleString('ru-RU')} · ${Array.isArray(game.state?.moveLog) ? game.state.moveLog.length : 0} полуходов</small></div><div class="saved-game-actions">${isGamePage ? `<button class="btn-primary btn-small" type="button" data-load-game="${escapeHTML(game.id)}">Продолжить</button>` : `<a class="btn-primary btn-small" href="game.html?load=${encodeURIComponent(game.id)}">Продолжить</a>`}<button class="icon-button" type="button" data-delete-game="${escapeHTML(game.id)}" aria-label="Удалить сохранённую партию" title="Удалить">×</button></div></article>`).join('');
  };
  document.addEventListener('click', (event) => {
    const del = event.target.closest('[data-delete-game]');
    if (del) { saveSavedGames(loadSavedGames().filter(g => g.id !== del.dataset.deleteGame)); renderSavedGames(); return; }
    const load = event.target.closest('[data-load-game]');
    if (load) document.dispatchEvent(new CustomEvent('chess:load-saved-game', { detail: { id: load.dataset.loadGame } }));
  });

  const form = $('#playerForm');
  if (form) form.addEventListener('submit', (event) => {
    event.preventDefault(); const input = $('#playerName'); const name = input.value.trim();
    if (!name) return;
    const players = loadPlayers();
    if (players.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { input.setCustomValidity('Игрок с таким именем уже существует.'); input.reportValidity(); return; }
    input.setCustomValidity(''); players.push({id: (window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now())), name, rating:0}); savePlayers(players); input.value=''; renderPlayers();
  });
  const playersList = $('#playersList');
  if (playersList) playersList.addEventListener('click', (event) => { const button = event.target.closest('[data-delete]'); if (!button) return; savePlayers(loadPlayers().filter(p => p.id !== button.dataset.delete)); renderPlayers(); });

  // The game engine uses legal-move filtering: a pseudo-legal move is accepted only if it leaves the moving side's king safe.
  const gameBoard = $('#board');
  if (gameBoard) {
    const cloneBoard = (board) => board.map(row => row.map(piece => piece ? {...piece} : null));
    const piece = (type, color) => ({ type, color });
    const initialBoard = () => {
      const back = ['r','n','b','q','k','b','n','r'];
      const board = Array.from({length:8}, () => Array(8).fill(null));
      for (let c=0;c<8;c++) { board[0][c]=piece(back[c],'b'); board[1][c]=piece('p','b'); board[6][c]=piece('p','w'); board[7][c]=piece(back[c],'w'); }
      return board;
    };
    let state;
    let selected = null;
    let legalForSelected = [];
    let orientation = 'w';
    let whiteName = 'Белые';
    let blackName = 'Чёрные';
    let whitePlayerId = '';
    let blackPlayerId = '';
    let gameSessionId = '';
    let lastScoredResult = null;
    const squareName = ([r,c]) => FILES[c] + (8-r);
    const opposite = (color) => color === 'w' ? 'b' : 'w';
    const inside = (r,c) => r>=0 && r<8 && c>=0 && c<8;
    const findKing = (board,color) => {
      for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]?.type==='k' && board[r][c].color===color) return [r,c];
      return null;
    };
    const isAttacked = (board, r, c, byColor) => {
      // Pawn attacks
      const pawnSourceRow = r + (byColor === 'w' ? 1 : -1);
      for (const dc of [-1,1]) if (inside(pawnSourceRow,c+dc) && board[pawnSourceRow][c+dc]?.color===byColor && board[pawnSourceRow][c+dc]?.type==='p') return true;
      // Knight attacks
      for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const rr=r+dr, cc=c+dc; if(inside(rr,cc)&&board[rr][cc]?.color===byColor&&board[rr][cc]?.type==='n') return true;
      }
      // King attacks
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(dr||dc) { const rr=r+dr,cc=c+dc; if(inside(rr,cc)&&board[rr][cc]?.color===byColor&&board[rr][cc]?.type==='k') return true; }
      // Sliding pieces
      for(const [dr,dc,types] of [[-1,0,['r','q']],[1,0,['r','q']],[0,-1,['r','q']],[0,1,['r','q']],[-1,-1,['b','q']],[-1,1,['b','q']],[1,-1,['b','q']],[1,1,['b','q']]]) {
        let rr=r+dr,cc=c+dc;
        while(inside(rr,cc)) { const p=board[rr][cc]; if(p) { if(p.color===byColor&&types.includes(p.type)) return true; break; } rr+=dr;cc+=dc; }
      }
      return false;
    };
    const inCheck = (board,color) => { const king=findKing(board,color); return !!king && isAttacked(board,king[0],king[1],opposite(color)); };
    const applyMove = (position, move) => {
      const next = { board: cloneBoard(position.board), turn: position.turn, castling: {...position.castling}, ep: position.ep ? [...position.ep] : null, halfmove: position.halfmove, fullmove: position.fullmove };
      const {from,to} = move; const moving=next.board[from[0]][from[1]]; const target=next.board[to[0]][to[1]];
      next.board[from[0]][from[1]]=null;
      if(move.enPassant) next.board[from[0]][to[1]]=null;
      if(move.castle) {
        if(to[1]===6) { next.board[from[0]][5]=next.board[from[0]][7]; next.board[from[0]][7]=null; }
        else { next.board[from[0]][3]=next.board[from[0]][0]; next.board[from[0]][0]=null; }
      }
      next.board[to[0]][to[1]]=piece(move.promotion || moving.type,moving.color);
      if(moving.type==='k') { next.castling[moving.color+'K']=false; next.castling[moving.color+'Q']=false; }
      if(moving.type==='r') {
        if(from[0]===7&&from[1]===0) next.castling.wQ=false; if(from[0]===7&&from[1]===7) next.castling.wK=false;
        if(from[0]===0&&from[1]===0) next.castling.bQ=false; if(from[0]===0&&from[1]===7) next.castling.bK=false;
      }
      if(target?.type==='r') {
        if(to[0]===7&&to[1]===0) next.castling.wQ=false; if(to[0]===7&&to[1]===7) next.castling.wK=false;
        if(to[0]===0&&to[1]===0) next.castling.bQ=false; if(to[0]===0&&to[1]===7) next.castling.bK=false;
      }
      next.ep = moving.type==='p' && Math.abs(to[0]-from[0])===2 ? [(from[0]+to[0])/2,from[1]] : null;
      next.halfmove = moving.type==='p'||target||move.enPassant ? 0 : next.halfmove+1;
      if(position.turn==='b') next.fullmove++;
      next.turn=opposite(position.turn);
      return next;
    };
    const pseudoMoves = (position, r, c) => {
      const board=position.board, p=board[r][c]; if(!p) return [];
      const moves=[]; const add=(rr,cc,extra={})=>{ if(!inside(rr,cc)) return; const target=board[rr][cc]; if(target?.color===p.color || target?.type==='k') return; moves.push({from:[r,c],to:[rr,cc],...extra}); };
      if(p.type==='p') {
        const dir=p.color==='w'?-1:1, start=p.color==='w'?6:1, promotionRow=p.color==='w'?0:7;
        if(inside(r+dir,c)&&!board[r+dir][c]) {
          add(r+dir,c, r+dir===promotionRow?{promotion:'q'}:{});
          if(r===start&&!board[r+2*dir][c]) add(r+2*dir,c,{doublePawn:true});
        }
        for(const dc of [-1,1]) {
          const rr=r+dir,cc=c+dc;
          if(inside(rr,cc)&&board[rr][cc]&&board[rr][cc].color!==p.color&&board[rr][cc].type!=='k') add(rr,cc,rr===promotionRow?{promotion:'q'}:{});
          if(position.ep&&position.ep[0]===rr&&position.ep[1]===cc) moves.push({from:[r,c],to:[rr,cc],enPassant:true});
        }
      } else if(p.type==='n') {
        for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr,c+dc);
      } else if(['b','r','q'].includes(p.type)) {
        const dirs=[]; if(['b','q'].includes(p.type)) dirs.push([-1,-1],[-1,1],[1,-1],[1,1]); if(['r','q'].includes(p.type)) dirs.push([-1,0],[1,0],[0,-1],[0,1]);
        for(const [dr,dc] of dirs) { let rr=r+dr,cc=c+dc; while(inside(rr,cc)) { const target=board[rr][cc]; if(!target) moves.push({from:[r,c],to:[rr,cc]}); else { if(target.color!==p.color&&target.type!=='k') moves.push({from:[r,c],to:[rr,cc]}); break; } rr+=dr;cc+=dc; } }
      } else if(p.type==='k') {
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(dr||dc) add(r+dr,c+dc);
        const home=p.color==='w'?7:0, enemy=opposite(p.color);
        if(r===home&&c===4&&!inCheck(board,p.color)) {
          const kingSide=p.color+'K', queenSide=p.color+'Q';
          if(position.castling[kingSide]&&board[home][7]?.type==='r'&&board[home][7]?.color===p.color&&!board[home][5]&&!board[home][6]&&!isAttacked(board,home,5,enemy)&&!isAttacked(board,home,6,enemy)) moves.push({from:[r,c],to:[home,6],castle:true});
          if(position.castling[queenSide]&&board[home][0]?.type==='r'&&board[home][0]?.color===p.color&&!board[home][1]&&!board[home][2]&&!board[home][3]&&!isAttacked(board,home,3,enemy)&&!isAttacked(board,home,2,enemy)) moves.push({from:[r,c],to:[home,2],castle:true});
        }
      }
      return moves;
    };
    const legalMoves = (position, color=position.turn) => {
      const out=[];
      for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(position.board[r][c]?.color===color) {
        for(const move of pseudoMoves(position,r,c)) { const next=applyMove(position,move); if(!inCheck(next.board,color)) out.push(move); }
      }
      return out;
    };
    const positionKey = (s) => s.board.map(row=>row.map(p=>p?(p.color+p.type):'--').join('')).join('/')+' '+s.turn+' '+Object.keys(s.castling).filter(k=>s.castling[k]).sort().join('')+' '+(s.ep?squareName(s.ep):'-');
    const insufficientMaterial = (board) => {
      const pieces=[];
      for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]&&board[r][c].type!=='k') pieces.push({ ...board[r][c], square:[r,c] });
      if(pieces.length===0) return true;
      if(pieces.length===1 && ['b','n'].includes(pieces[0].type)) return true;
      if(pieces.every(p=>p.type==='b')) { const colors=new Set(pieces.map(p=>(p.square[0]+p.square[1])%2)); if(colors.size===1) return true; }
      return false;
    };
    const getOutcome = () => {
      if(state.manualResult) return {over:true,result:'½-½',text:state.manualResult};
      const moves=legalMoves(state);
      if(moves.length===0) return inCheck(state.board,state.turn) ? {over:true, result:opposite(state.turn)==='w'?'1-0':'0-1', text:`Мат! Победили ${opposite(state.turn)==='w'?whiteName:blackName}.`} : {over:true,result:'½-½',text:'Пат — ничья.'};
      if(state.halfmove>=100) return {over:true,result:'½-½',text:'Ничья по правилу 50 ходов.'};
      if((state.repetitions[positionKey(state)]||0)>=3) return {over:true,result:'½-½',text:'Ничья: троекратное повторение позиции.'};
      if(insufficientMaterial(state.board)) return {over:true,result:'½-½',text:'Ничья: недостаточно материала для мата.'};
      return {over:false, check:inCheck(state.board,state.turn), moves};
    };
    const pieceAt = (sq) => state.board[sq[0]][sq[1]];
    const moveSAN = (move, before, after, legalBefore) => {
      const p=pieceAtFrom(before.board,move.from); if(move.castle) return move.to[1]===6?'O-O':'O-O-O';
      const capture=!!before.board[move.to[0]][move.to[1]]||!!move.enPassant;
      let text='';
      if(p.type!=='p') {
        text=p.type.toUpperCase();
        const rivals=legalBefore.filter(m=>m.from[0]!==move.from[0]||m.from[1]!==move.from[1]).filter(m=>m.to[0]===move.to[0]&&m.to[1]===move.to[1]&&pieceAtFrom(before.board,m.from).type===p.type);
        if(rivals.length) { const sameFile=rivals.some(m=>m.from[1]===move.from[1]); const sameRank=rivals.some(m=>m.from[0]===move.from[0]); if(!sameFile) text+=FILES[move.from[1]]; else if(!sameRank) text+=(8-move.from[0]); else text+=FILES[move.from[1]]+(8-move.from[0]); }
      } else if(capture) text=FILES[move.from[1]];
      if(capture) text+='x'; text+=squareName(move.to); if(move.promotion) text+='='+move.promotion.toUpperCase();
      if(inCheck(after.board,after.turn)) text+=legalMoves(after).length?' +':' #';
      return text;
    };
    const pieceAtFrom=(board,sq)=>board[sq[0]][sq[1]];
    const snapshot = () => ({ gameSessionId, whitePlayerId, blackPlayerId, ratingApplied: lastScoredResult, board:cloneBoard(state.board), turn:state.turn, castling:{...state.castling}, ep:state.ep?[...state.ep]:null, halfmove:state.halfmove, fullmove:state.fullmove, repetitions:{...state.repetitions}, history:state.history.map(h=>({...h})), moveLog:[...state.moveLog], manualResult:state.manualResult });
    const freshState = () => {
      const s={gameSessionId,whitePlayerId,blackPlayerId,ratingApplied:null,board:initialBoard(),turn:'w',castling:{wK:true,wQ:true,bK:true,bQ:true},ep:null,halfmove:0,fullmove:1,repetitions:{},history:[],moveLog:[],manualResult:null};
      s.repetitions[positionKey(s)]=1; return s;
    };
    const getDisplayNames = () => {
      const whiteSelect=$('#whitePlayer'), blackSelect=$('#blackPlayer');
      whiteName=whiteSelect?.selectedOptions[0]?.textContent && whiteSelect.value ? whiteSelect.selectedOptions[0].textContent : 'Белые';
      blackName=blackSelect?.selectedOptions[0]?.textContent && blackSelect.value ? blackSelect.selectedOptions[0].textContent : 'Чёрные';
    };
    const renderMoveList = () => {
      const list=$('#moveList'); if(!list) return;
      if(!state.moveLog.length) { list.innerHTML='<p class="move-empty">Ходы появятся здесь после начала партии.</p>'; return; }
      list.innerHTML=state.moveLog.reduce((html,entry,i)=>{ if(i%2===0) html+=`<div class="move-row"><span class="move-number">${Math.floor(i/2)+1}.</span><span class="move-white">${escapeHTML(entry)}</span><span class="move-black">${escapeHTML(state.moveLog[i+1]||'')}</span></div>`; return html; },'');
      list.scrollTop=list.scrollHeight;
    };
    const render = () => {
      gameBoard.innerHTML='';
      const outcome=getOutcome();
      if (outcome.over && outcome.result && outcome.result !== '½-½' && gameSessionId && lastScoredResult !== outcome.result) { applyGameScore(gameSessionId, outcome.result, whitePlayerId, blackPlayerId); lastScoredResult = outcome.result; renderPlayers(); }
      for(let viewR=0;viewR<8;viewR++) for(let viewC=0;viewC<8;viewC++) {
        const r=orientation==='w'?viewR:7-viewR, c=orientation==='w'?viewC:7-viewC;
        const p=state.board[r][c], cell=document.createElement('button'); cell.type='button'; cell.className=`cell ${(r+c)%2===0?'light':'dark'}`; cell.dataset.row=r; cell.dataset.col=c;
        if(selected&&selected[0]===r&&selected[1]===c) cell.classList.add('selected');
        if(legalForSelected.some(m=>m.to[0]===r&&m.to[1]===c)) { cell.classList.add(p?'legal-capture':'legal-target'); }
        const king=findKing(state.board,state.turn); if(p?.type==='k'&&p.color===state.turn&&outcome.check) cell.classList.add('in-check');
        cell.textContent=p?PIECES[p.color][p.type]:'';
        cell.setAttribute('aria-label',`${squareName([r,c])}${p?', '+(p.color==='w'?'белые ':'чёрные ')+PIECE_NAMES[p.type]:' , пустая клетка'}`);
        if(viewC===0) { const rank=document.createElement('span'); rank.className='coord rank'; rank.textContent=String(8-r); cell.appendChild(rank); }
        if(viewR===7) { const file=document.createElement('span'); file.className='coord file'; file.textContent=FILES[c]; cell.appendChild(file); }
        gameBoard.appendChild(cell);
      }
      const status=$('#gameStatus'), turn=$('#turnIndicator');
      if(outcome.over) { status.textContent=outcome.text; status.classList.add('game-over'); if(turn) turn.textContent=`Результат: ${outcome.result}`; }
      else { status.textContent=outcome.check?`Шах! Ход ${state.turn==='w'?whiteName:blackName}.`:`Ход ${state.turn==='w'?whiteName:blackName}.`; status.classList.remove('game-over'); if(turn) turn.textContent=`${state.turn==='w'?'♔':'♚'} ${state.turn==='w'?whiteName:blackName}${outcome.check?' — шах':''}`; }
      const undo=$('#undoMoveBtn'); if(undo) undo.disabled=state.history.length===0;
      const flip=$('#flipBoardBtn'); if(flip) flip.setAttribute('aria-pressed',orientation!=='w'?'true':'false');
      const claim=$('#claimDrawBtn'); if(claim) claim.disabled=outcome.over || !(state.halfmove>=100 || (state.repetitions[positionKey(state)]||0)>=3);
      renderMoveList();
    };
    const performMove = (move) => {
      const outcome=getOutcome(); if(outcome.over) return;
      const before=snapshot(), legalBefore=legalMoves(state);
      let chosen={...move};
      const moving=pieceAt(chosen.from);
      if(moving.type==='p'&&(chosen.to[0]===0||chosen.to[0]===7)) {
        const choice=window.prompt('Превратить пешку в: ферзь (q), ладью (r), слона (b) или коня (n)?','q');
        const key=String(choice||'q').trim().toLowerCase(); chosen.promotion=['q','r','b','n'].includes(key)?key:'q';
      }
      const next=applyMove(state,chosen); const san=moveSAN(chosen,state,next,legalBefore);
      state.history.push(before); state.board=next.board; state.turn=next.turn; state.castling=next.castling; state.ep=next.ep; state.halfmove=next.halfmove; state.fullmove=next.fullmove;
      state.moveLog.push(san); const key=positionKey(state); state.repetitions[key]=(state.repetitions[key]||0)+1;
      selected=null; legalForSelected=[]; render();
    };
    gameBoard.addEventListener('click',(event)=>{
      const cell=event.target.closest('.cell'); if(!cell) return;
      const sq=[Number(cell.dataset.row),Number(cell.dataset.col)], p=pieceAt(sq), outcome=getOutcome(); if(outcome.over) return;
      if(selected) {
        const move=legalForSelected.find(m=>m.to[0]===sq[0]&&m.to[1]===sq[1]);
        if(move) { performMove(move); return; }
      }
      if(p&&p.color===state.turn) { selected=sq; legalForSelected=legalMoves(state).filter(m=>m.from[0]===sq[0]&&m.from[1]===sq[1]); }
      else { selected=null; legalForSelected=[]; }
      render();
    });
    $('#startGameBtn')?.addEventListener('click',()=>{
      getDisplayNames(); whitePlayerId=$('#whitePlayer')?.value || ''; blackPlayerId=$('#blackPlayer')?.value || ''; gameSessionId=(window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now())); lastScoredResult=null; state=freshState(); selected=null; legalForSelected=[]; orientation='w';
      const saveBtn = $('#saveGameBtn'); if (saveBtn) { delete saveBtn.dataset.savedId; saveBtn.textContent = '▣ Сохранить партию'; }
      const section=$('#boardSection'); section.hidden=false; section.style.display='';
      const whiteLabel=$('#whiteNameLabel'), blackLabel=$('#blackNameLabel'); if(whiteLabel) whiteLabel.textContent=whiteName; if(blackLabel) blackLabel.textContent=blackName;
      render(); section.scrollIntoView({behavior:'smooth',block:'start'});
    });
    $('#resetGameBtn')?.addEventListener('click',()=>{ state=freshState(); selected=null; legalForSelected=[]; render(); });
    $('#undoMoveBtn')?.addEventListener('click',()=>{ if(!state.history.length) return; const prior=state.history.pop(); state=prior; selected=null; legalForSelected=[]; render(); });
    $('#flipBoardBtn')?.addEventListener('click',()=>{ orientation=orientation==='w'?'b':'w'; render(); });
    $('#claimDrawBtn')?.addEventListener('click',()=>{ const current=getOutcome(); if(current.over) return; if(state.halfmove>=100) state.manualResult='Ничья по правилу 50 ходов (заявлена игроком).'; else if((state.repetitions[positionKey(state)]||0)>=3) state.manualResult='Ничья по троекратному повторению позиции (заявлена игроком).'; render(); });
    $('#newGameBtn')?.addEventListener('click',()=>{ state=freshState(); selected=null; legalForSelected=[]; const saveBtn=$('#saveGameBtn'); if(saveBtn){delete saveBtn.dataset.savedId;saveBtn.textContent='▣ Сохранить партию';} render(); });
    const saveCurrentGame = () => {
      const games = loadSavedGames();
      const id = $('#saveGameBtn')?.dataset.savedId || (window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()));
      const savedState = snapshot();
      // Keep one flat copy of the undo stack; nested history arrays otherwise make saves grow exponentially.
      savedState.history = savedState.history.map(({ history, ...historic }) => historic);
      const entry = { id, whiteName, blackName, state: savedState, updatedAt: Date.now() };
      const index = games.findIndex(g => g.id === id);
      if (index >= 0) games[index] = entry; else games.unshift(entry);
      if (!saveSavedGames(games)) { window.alert('Не удалось сохранить партию. Возможно, в браузере недостаточно места.'); return; }
      const saveBtn = $('#saveGameBtn'); if (saveBtn) { saveBtn.dataset.savedId = id; saveBtn.textContent = '✓ Сохранено'; }
      renderSavedGames();
    };
    $('#saveGameBtn')?.addEventListener('click', saveCurrentGame);
    document.addEventListener('chess:load-saved-game', (event) => {
      const game = loadSavedGames().find(g => g.id === event.detail.id);
      if (!game || !game.state || !Array.isArray(game.state.board)) return;
      const loaded = game.state;
      const flatHistory = Array.isArray(loaded.history) ? loaded.history.map(({ history, ...historic }) => historic) : [];
      state = { ...loaded, history: flatHistory.map((historic, index) => ({ ...historic, history: flatHistory.slice(0, index) })) };
      whiteName = game.whiteName || 'Белые'; blackName = game.blackName || 'Чёрные'; whitePlayerId = game.state.whitePlayerId || ''; blackPlayerId = game.state.blackPlayerId || ''; gameSessionId = game.state.gameSessionId || game.id; lastScoredResult = game.state.ratingApplied || null;
      selected = null; legalForSelected = []; orientation = 'w';
      const section = $('#boardSection'); if (section) { section.hidden = false; section.style.display = ''; }
      const whiteLabel = $('#whiteNameLabel'), blackLabel = $('#blackNameLabel');
      if (whiteLabel) whiteLabel.textContent = whiteName; if (blackLabel) blackLabel.textContent = blackName;
      const saveBtn = $('#saveGameBtn'); if (saveBtn) { saveBtn.dataset.savedId = game.id; saveBtn.textContent = 'Сохранить изменения'; }
      render(); section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    state=freshState(); render();
    const requestedSave = new URLSearchParams(window.location.search).get('load');
    if (requestedSave) document.dispatchEvent(new CustomEvent('chess:load-saved-game', { detail: { id: requestedSave } }));
  }
  renderPlayers();
  renderSavedGames();
})();
