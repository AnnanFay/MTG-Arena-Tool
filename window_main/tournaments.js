/*
global
	timestamp,
	toHHMM,
	userName,
	ipc_send,
	change_background
*/

let tournaments_list;

// Should separate these two into smaller functions
function open_tournaments_tab(arg) {
	if (arg != null) {
		tournaments_list = arg;
	}

	let mainDiv = document.getElementById("ux_0");
	mainDiv.classList.remove("flex_item");
	mainDiv.innerHTML = '';

	let d = document.createElement("div");
	d.classList.add("list_fill");
	mainDiv.appendChild(d);

	let cont = document.createElement("div");
	cont.classList.add("tournament_list_cont");

	cont = document.createElement("div");
	cont.classList.add("tournament_list_cont");

	tournaments_list.forEach(function(tou) {
		console.log(tou);

		let div = document.createElement("div");
		div.classList.add("tou_container");
		div.id = tou._id;


		let sd = tou.signupDuration;
		let rd = tou.roundDuration;
		let now = timestamp();

		let roundsStart = tou.starts + (sd * 60*60);
		let roundEnd = tou.starts + (sd * 60*60) + (tou.currentRound * (60*60) * rd);

		let state = "-";
		let stateb = "-";
		if (tou.state == -1) {
			state = "Registration begin in "+(toHHMM(now - tou.starts));
		}
		if (tou.state == 0) {
			state = "Registration in progress.";
			stateb = toHHMM(roundsStart-now)+" left";
		}
		if (tou.state == 1) {
			state = "Round "+(tou.currentRound+1)+" in progress.";
			stateb = toHHMM(roundEnd-now)+" left";
		}
		if (tou.state == 4) {
			state = "Tournament finish.";
			stateb = tou.winner.slice(0, -6);
		}

		let nam = document.createElement("div");
		nam.classList.add("tou_name");
		nam.innerHTML = tou.name;

		let st = document.createElement("div");
		st.classList.add("tou_state");
		st.innerHTML = state;

		let pln = document.createElement("div");
		pln.classList.add("tou_cell");
		pln.innerHTML = stateb;

		let stb = document.createElement("div");
		stb.classList.add("tou_cell");
		stb.innerHTML = tou.players.length;

		div.appendChild(nam);
		div.appendChild(st);
		div.appendChild(stb);
		div.appendChild(pln);
		cont.appendChild(div);
	});

	mainDiv.appendChild(cont);

	$('.tou_container').each(function() {
		$(this).on("click", function() {
			let ti = $(this).attr('id');
			ipc_send("tou_get", ti);
		});
	});
}

function open_tournament(tou) {
	let mainDiv = $("#ux_1");
	mainDiv.html('');

	let sd = tou.signupDuration;
	let rd = tou.roundDuration;
	let now = timestamp();
	let roundsStart = tou.starts + (sd * 60*60);
	let roundEnd = tou.starts + (sd * 60*60) + (tou.currentRound * 60*60 * rd);

	let joined = false;
	let record = '-';
	let stats;
	if (tou.players.indexOf(userName) !== -1) {
		joined = true;
		stats = tou.playerStats[userName];
		record = stats.w+' - '+stats.d+' - '+stats.l;
	}

	let top = $(`<div class="decklist_top"><div class="button back"></div><div class="deck_name">${tou.name}</div></div>`);
	let flr = $(`<div class="tou_top_status" style="align-self: center;"></div>`);

	let state = "";
	if (tou.state == -1) {
		state = "Registration begin in "+(toHHMM(now - tou.starts));
	}
	if (tou.state == 0) {
		state = toHHMM(roundsStart-now)+" left to register.";
	}
	if (tou.state == 1) {
		state = "Round "+(tou.currentRound+1)+" ends in "+toHHMM(roundEnd-now);
	}
	if (tou.state == 4) {
		state = "Tournament finish.";
	}
	
	flr.html(state);
	flr.appendTo(top);
	top.appendTo(mainDiv);

	if (tou.state <= 0) {
		if (joined) {
			$('<div class="button_simple but_drop">Drop</div>').appendTo(mainDiv);
		}
		else {
			$('<div class="button_simple but_join">Join</div>').appendTo(mainDiv);
		}

		$(".but_join").click(function () {
			ipc_send('tou_join', tou._id);
		});

		$(".but_drop").click(function () {
			ipc_send('tou_drop', tou._id);
		});

	}
	else {
		$(`<div class="tou_record green">${record}</div>`).appendTo(mainDiv);

		let tabs = $('<div class="tou_tabs_cont"></div>');
		let tab_rounds = $('<div class="tou_tab tabr tou_tab_selected">Rounds</div>');
		let tab_standings = $('<div class="tou_tab tabp ">Standings</div>');

		tab_rounds.appendTo(tabs);
		tab_standings.appendTo(tabs);
		tabs.appendTo(mainDiv);

		let tab_cont_a = $('<div class="tou_cont_a"></div>');
		for (let i=0; i<tou.currentRound+1; i++) {
			let rname = 'round_'+i;
			if (tou[rname] !== undefined) {
				$(`<div class="tou_round_title">Round ${i+1}</div>`).appendTo(tab_cont_a);
				let round_cont = $('<div class="tou_round_cont"></div>');

				tou[rname].forEach(function(match) {
					let cont = $('<div class="tou_match_cont"></div>');
					let p1wc = '';
					let p2wc = '';
					if (match.winner == 1) {
						p1wc = 'tou_score_win';
					}
					if (match.winner == 2) {
						p2wc = 'tou_score_win';
					}

					let d1 = '';
					let d2 = '';
					if (match.p2 == "bye")	match.p2 = "BYE#00000";
					try {
						if (match.drop1)	d1 = ' (drop)';
						if (match.drop2)	d2 = ' (drop)';
					}
					catch (e) {
						console.error(e);
					}

					let s = '';
					if (match.p1 == userName)	s = 'style="color: rgba(183, 200, 158, 1);"';
					let p1 = $(`<div ${s} class="tou_match_p ${match.p1}pn">${match.p1.slice(0, -6)+d1}<div class="${p1wc} tou_match_score">${match.p1w}</div></div>`);
					s = '';
					if (match.p2 == userName)	s = 'style="color: rgba(183, 200, 158, 1);"';
					let p2 = $(`<div ${s} class="tou_match_p ${match.p2}pn">${match.p2.slice(0, -6)+d2}<div class="${p2wc} tou_match_score">${match.p2w}</div></div>`);

					p1.appendTo(cont);
					p2.appendTo(cont);
					cont.appendTo(round_cont);
				})
				round_cont.appendTo(tab_cont_a);
			}
		}

		$('<div class="button_simple but_drop">Drop</div>').appendTo(tab_cont_a);

		let tab_cont_b = $('<div class="tou_cont_b" style="height: 0px"></div>');
		tou.players.sort(function(a, b) {
			if (tou.playerStats[a].mp > tou.playerStats[b].mp)		return -1;
			else if (tou.playerStats[a].mp < tou.playerStats[b].mp)	return 1;
			else {
				if (tou.playerStats[a].omwp > tou.playerStats[b].omwp)		return -1;
				else if (tou.playerStats[a].omwp < tou.playerStats[b].omwp)	return 1;
				else {
					if (tou.playerStats[a].gwp > tou.playerStats[b].gwp)		return -1;
					else if (tou.playerStats[a].gwp < tou.playerStats[b].gwp)	return 1;
					else {
						if (tou.playerStats[a].ogwp > tou.playerStats[b].ogwp)		return -1;
						else if (tou.playerStats[a].ogwp < tou.playerStats[b].ogwp)	return 1;
					}
				}
			}
			return 0;
		});

		let line = $('<div class="tou_stand_line_title line_dark"></div>');
		$('<div class="tou_stand_name">Name</div><div class="tou_stand_cell">Points</div><div class="tou_stand_cell">Score</div><div class="tou_stand_cell">Matches</div><div class="tou_stand_cell">Games</div><div class="tou_stand_cell">OMW</div><div class="tou_stand_cell">GW</div><div class="tou_stand_cell">OGW</div>').appendTo(line);
		line.appendTo(tab_cont_b);

		tou.players.forEach( function(pname, index) {
			let stat = tou.playerStats[pname];
			if (index % 2) {
				line = $('<div class="tou_stand_line line_dark"></div>');
			}
			else {
				line = $('<div class="tou_stand_line"></div>');
			}

			let s = '';
			if (pname == userName)	s = 'style="color: rgba(183, 200, 158, 1);"';

			let str = `<div ${s} class="tou_stand_name">${pname.slice(0, -6)}</div>
			<div class="tou_stand_cell">${stat.mp}</div>
			<div class="tou_stand_cell">${stat.w}-${stat.d}-${stat.l}</div>
			<div class="tou_stand_cell">${stat.rpl}</div>
			<div class="tou_stand_cell">${stat.gpl}</div>
			<div class="tou_stand_cell">${Math.round(stat.omwp*10000)/100}%</div>
			<div class="tou_stand_cell">${Math.round(stat.gwp*10000)/100}%</div>
			<div class="tou_stand_cell">${Math.round(stat.ogwp*10000)/100}%</div>`;

			$(str).appendTo(line);
			line.appendTo(tab_cont_b);
		});

		tab_cont_a.appendTo(mainDiv);
		tab_cont_b.appendTo(mainDiv);

		$(".tabr").click(function () {
			if (!$(this).hasClass("tou_tab_selected")) {
				$(this).addClass("tou_tab_selected");
				$(".tabp").removeClass("tou_tab_selected");
				$(".tou_cont_a").css("height", "auto");
				$(".tou_cont_b").css("height", "0px");
			}
		});

		$(".tabp").click(function () {
			if (!$(this).hasClass("tou_tab_selected")) {
				$(this).addClass("tou_tab_selected");
				$(".tabr").removeClass("tou_tab_selected");
				$(".tou_cont_b").css("height", "auto");
				$(".tou_cont_a").css("height", "0px");
			}
		});

		$(".but_drop").click(function () {
			ipc_send('tou_drop', tou._id);
		});
	}


	$(".back").click(function () {
        change_background("default");
		$('.moving_ux').animate({'left': '0px'}, 250, 'easeInOutCubic'); 
	});
}

module.exports = {
    open_tournaments_tab: open_tournaments_tab,
    open_tournament: open_tournament
}