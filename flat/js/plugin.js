/*! Copyright (C) 2014 AJAXBOARD. All rights reserved. */

(function (global, $) {
	"use strict";
	var _selector;
	var _refreshable = true, _dismissed = 0, core = global.ajaxboard;
	global.clickCmtAlert = function () {
		dispCommentList(null, true);
	};
	function viewport() {
		var e = window, a = "inner";
		if (!("innerWidth" in e)) {
			a = "client";
			e = document.documentElement || document.body;
		}
		return {width: e[a + "Width"], height: e[a + "Height"]};
	}
	function getPage(args) {
		return core.ajax("html", core.current_url, null, null, args);
	}
	function rebindHandlers() {
		var nCheck = $(".flatBoard .webzine-style .author");
		if (nCheck.find("img").length) {
			nCheck.removeClass("author").css("margin-right", "10px");
		}

		var flatBoard = $(".flatBoard");
		var gallery_list = flatBoard.find(".m-gallery > .list > li");
		gallery_list.find("img[title='file']").hide();
		var webzine_list = flatBoard.find(".m-webzine > .list > li");
		webzine_list.find("img[title='file']").hide();
		var talkbox = flatBoard.find(".m-talkbox > .list > li");
		talkbox.find("img[title='file']").hide();
		talkbox.find(".bubble").width(talkbox.width() - 75);
		if (viewport().width > 567){
			webzine_list.find(".webzine-container").width(webzine_list.width() - 145);
		}

		$("input, select, textarea").cancelZoom();
	}
	function dispDocumentList(args) {
		if (!(_selector && $(".flatBoard").length)) {
			return false;
		}
		if (!$.isPlainObject(args)) {
			args = {};
		}
		var handler = getPage(args).done(function (response, status, xhr) {
			var $obj = $("<div>").append($.parseHTML(response)).find(".flatBoard");
			var $body = $(".flatBoard");
			$body.find(_selector + " > .list").html($obj.find(_selector + " > .list").html());
			$body.find("footer > .paging").html($obj.find("footer > .paging").html());
			$.each(function (key, val) {
				core.current_url = core.current_url.setQuery(key, val);
			});
			rebindHandlers();
		});

		return handler;
	}
	function dispDocumentListByPage(page) {
		return dispDocumentList({page: page});
	}
	function dispCommentList(args, manual) {
		if (!$("#comment").length) {
			return false;
		}
		if (!manual && !(_refreshable && !$(".flatBoard .comment-control .btClose").filter(":visible").length)) {
			$(".flatBoard .comment-list").append($("#cmt_alert").show());
			_dismissed++;
			return false;
		}
		if (!$.isPlainObject(args)) {
			args = {};
		}
		var handler = getPage(args).done(function (response, status, xhr) {
			var $obj = $("<div>").append($.parseHTML(response)).find("#comment");
			var $body = $("#comment");
			$("body").append($("#cmt_alert").hide());
			$body.find(".read-control .comment-num .num").html($obj.find(".read-control .comment-num .num").html());
			$body.find(".comment").html($obj.find(".comment").html());
			$.each(args, function (key, val) {
				core.current_url = core.current_url.setQuery(key, val);
			});
			rebindHandlers();
			_refreshable = true;
			_dismissed = 0;
		});

		return handler;
	}
	function dispCommentListByCpage(cpage) {
		return dispCommentList({cpage: cpage}, true);
	}
	core.insertTrigger("clearEditor", "after", function () {
		$("#rText").val("");
	});
	var called = false;
	core.insertTrigger("events.connect", "after", function (type) {
		if (called) return;
		called = true;
		var flatBoard = $(".flatBoard")
		var dcma = global.doCallModuleAction;
		if (dcma && $.isFunction(dcma)) {
			var ccma = function (obj) {
				if (obj.message !== "success") {
					alert(obj.message);
				}
			};
			global.doCallModuleAction = function (module, action, target_srl) {
				var isAction = ["procDocumentVoteUp", "procDocumentVoteDown", "procDocumentDeclare", "procCommentVoteUp", "procCommentVoteDown", "procCommentDeclare"];
				if ($.inArray(action, isAction) > -1) {
					var params = {
						target_srl: target_srl,
						cur_mid: core.current_mid,
						mid: core.current_mid
					};
					return exec_xml(module, action, params, ccma);
				}
				else if ($.isFunction(dcma)) {
					return dcma(module, action, target_srl);
				}
			};
		}
		var cic = global.completeInsertComment;
		if (cic && $.isFunction(cic)) {
			global.completeInsertComment = function (obj) {
				core.clearEditor();
				flatBoard.find(".comment-write .cWrite-body .btCancel").trigger("click");
			};
		}
		flatBoard.on("click", ".comment-el .blind-text", function (e) {
			$(this).next(".blind-comment").toggle();
		})
		.on("click", ".comment-control .btClose", function (e) {
			if (_dismissed) {
				_dismissed = 0;
				dispCommentList();
			}
		})
		.on("click", "#comment .paging [href]", function (e) {
			var $this = $(this);
			var href = $this.attr("href");
			if (href.indexOf("#") > -1) {
				href = href.substring(0, href.indexOf("#"));
			}
			var cpage = href.getQuery("cpage");
			dispCommentListByCpage(cpage > 1 && $this.hasClass("direction") ? "" : cpage);
			return false;
		})
		.on("click", ".list-footer .paging [href]", function (e) {
			var $this = $(this);
			var href = $this.attr("href");
			if (href.indexOf("#") > -1) {
				href = href.substring(0, href.indexOf("#"));
			}
			var page = href.getQuery("page");
			dispDocumentListByPage(page > 1 && $this.hasClass("direction") ? "" : page);
			return false;
		});
		if (viewport().width < 768) {
			flatBoard.on("click", ".comment-el", function (e) {
				_refreshable = false;
				$("#comment-control-dummy").show();
				$(this).next(".comment-control").show();
				$("body").on("touchmove", function (e) {e.preventDefault()});
			})
			.on("click", ".comment-body a, .secret-comment, .blind-text", function (e) {
				e.stopPropagation();
			})
			.on("click", ".comment-control .bt-cc-cancel", function (e) {
				$(this).closest(".comment-control").hide();
				$("#comment-control-dummy").hide();
				$("body").off("touchmove");
				if (_dismissed) {
					dispCommentList(null, true);
				}
			});
		}
		else {
			flatBoard.on("click", ".comment-control .btMore", function (e) {
				var $this = $(this);
				$this.parent().prevAll(".phone").css("display", "inline-block");
				$this.next(".btClose").css("display", "inline-block");
				$this.hide();
			})
			.on("click", ".comment-control .btClose", function (e) {
				var $this = $(this);
				$this.parent().prevAll(".phone").hide();
				$this.prev(".btMore").css("display", "inline-block");
				$this.hide();
				var blogbox_body = flatBoard.find(".m-blogbox > .list > li > .bubble");
				var talkbox_body = flatBoard.find(".m-talkbox > .list > li > .bubble");
				blogbox_body.find(".left-side").width(blogbox_body.width() - 340);
				talkbox_body.find(".left-side").width(talkbox_body.width() - 345);
			});
		}
		$(window).resize(function (e) {
			var webzine = flatBoard.find(".m-webzine > .list > li");
			if (viewport().width < 568) {
				webzine.find(".thumb-image").width("28%").css("margin-left", "4%");
				webzine.find(".webzine-container").width("68%");
			}
			else {
				webzine.find(".thumb-image").width(130).css("margin-left", "12px");
				webzine.find(".webzine-container").width(webzine.width() - 145);
			}
			var talkbox = flatBoard.find(".m-talkbox > .list > li");
			talkbox.find(".bubble").width(talkbox.width() - 75);
		});
	});
	core.insertTrigger("events.insertDocument", "before", function (obj) {
		dispDocumentList();
	});
	core.insertTrigger("events.deleteDocument", "before", function (obj) {
		dispDocumentList();
	});
	core.insertTrigger("events.voteDocument", "before", function (obj) {
		var point = obj.extra_vars.point;
		($(".flatBoard").length) &&
		(obj.target_srl == core.document_srl) &&
			$(".flatBoard .read-control " + (point > 0 ? ".btVote" : ".btBlame") + " > .num2 > span").html(point);
	});
	core.insertTrigger("events.insertComment", "before", function (obj) {
		dispCommentList();
	});
	core.insertTrigger("events.deleteComment", "before", function (obj) {
		dispCommentList();
	});
	core.insertTrigger("events.voteComment", "before", function (obj) {
		($("#comment_" + obj.target_srl).length) &&
			dispCommentList();
	});
	$(function () {
		var stack = [".m-list", ".m-news", ".m-webzine", ".m-gallery", ".m-blogbox", ".m-talkbox"];
		$.each(stack, function (idx, item) {
			if ($(".flatBoard " + item).length) {
				_selector = item;
				return false;
			}
		});
	});
})(this, jQuery);

/* End of file */
