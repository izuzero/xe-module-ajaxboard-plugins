/*! Copyright (C) 2014 AJAXBOARD. All rights reserved. */

(function (global, $) {
	"use strict";
	var core = global.ajaxboard;
	var recomment = false;
	function getPage(args) {
		return core.ajax("html", core.current_url, null, null, args);
	}
	function dispCommentList(args) {
		if (!$("#cmtPosition").length) {
			return false;
		}
		if (recomment) {
			$(".fdb_lst_ul").append($("#cmt_alert").show());
			return false;
		}
		var handler = getPage(args);
			handler.done(function (response, status, xhr) {
				var $obj = $("<div>").append($.parseHTML(response)).find("#cmtPosition");
				$(".cmt_editor").append($("#re_cmt").hide());
				$("body").append($("#cmt_alert").hide());
				$("#cmtPosition").html($obj.html());
				board("#bd_" + core.module_srl + "_" + (core.document_srl || 0));
			});

		return handler;
	}
	function dispCommentListByCpage(cpage) {
		recomment = false;
		var handler = dispCommentList({cpage: cpage});
		if (handler) {
			handler.done(function (response, status, xhr) {
				core.current_url = core.current_url.setQuery("cpage", cpage);
				core.scrolling(1, SLIDE_DURATION, "#cmtPosition");
			});
		}

		return handler;
	}
	function dispDocumentList(args) {
		if (!$(".bd_lst_wrp").length) {
			return false;
		}
		var handler = getPage(args);
			handler.done(function (response, status, xhr) {
				var $obj = $("<div>").append($.parseHTML(response)).find(".bd_lst_wrp");
				var $body = $(".bd_lst_wrp");
				$body.children(".bd_lst").html($obj.children(".bd_lst").html());
				$body.children(".bd_pg").html($obj.children(".bd_pg").html());
				$(".cmt_pg").remove();
				board("#bd_" + core.module_srl + "_" + (core.document_srl || 0));
			});

		return handler;
	}
	function dispDocumentListByPage(page) {
		var handler = dispDocumentList({page: page});
		if (handler) {
			handler.done(function (response, status, xhr) {
				core.current_url = core.current_url.setQuery("page", page);
			});
		}

		return handler;
	}
	var called = false;
	core.insertTrigger("clearEditor", "after", function () {
		$(".simple_wrt textarea[id*='editor_']").val("");
	});
	core.insertTrigger("events.connect", "after", function (type) {
		if (called) return;
		called = true;
		var rc = global.reComment;
		if (rc && $.isFunction(rc)) {
			global.reComment = function (doc_srl, cmt_srl, edit_url) {
				recomment = true;
				rc(doc_srl, cmt_srl, edit_url);
			};
		}
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
			};
		}
		$("#cmtPosition").on("click", ".fdb_nav [href]", function (e) {
			var href = $(this).attr("href");
			if (href.indexOf("#") > -1) {
				href = href.substring(0, href.indexOf("#"));
			}
			var act = href.getQuery("act");
			var comment_srl = href.getQuery("comment_srl");
			if (comment_srl && act == "dispBoardDeleteComment") {
				core.deleteComment(
					comment_srl,
					href,
					function (response, status, xhr) {
						alert(response.message);
					},
					function (comment_srl) {
						dispCommentList();
					}
				);
				return false;
			}
		})
		.on("click", ".bd_pg [href], .cmt_pg [href]", function (e) {
			var $this = $(this);
			var href = $this.attr("href");
			if (href.indexOf("#") > -1) {
				href = href.substring(0, href.indexOf("#"));
			}
			var cpage = href.getQuery("cpage");
			if (cpage) {
				dispCommentListByCpage(cpage > 1 && $this.hasClass("direction") ? "" : cpage);
				return false;
			}
		});
		$("#re_cmt .close").on("click", function (e) {
			recomment = false;
			$("#re_cmt").hide();
			dispCommentList();
		});
		$("#re_cmt input[type='submit']").on("click", function (e) {
			recomment = false;
			$("#re_cmt").hide();
		});
		$(".bd_lst_wrp").on("click", ".bd_pg [href]", function (e) {
			var href = $(this).attr("href");
			if (href.indexOf("#") > -1) {
				href = href.substring(0, href.indexOf("#"));
			}
			var page = href.getQuery("page");
			dispDocumentListByPage(page || 1);
			return false;
		});
	});
	core.insertTrigger("events.insertDocument", "before", function (obj) {
		dispDocumentList();
	});
	core.insertTrigger("events.voteDocument", "before", function (obj) {
		var point = obj.extra_vars.point;
		(core.document_srl == obj.target_srl) &&
			(point > 0) ?
			$(".rd_vote").children().eq(0).children().eq(0).html("♥ " + point) :
			$(".rd_vote").children().eq(1).children().eq(0).html("♥ " + point);
	});
	core.insertTrigger("events.insertComment", "before", function (obj) {
		($("#comment_" + obj.parent_srl).length ||
		 $("#" + obj.parent_srl + "_comment").length) &&
			dispCommentList();
	});
	core.insertTrigger("events.deleteComment", "before", function (obj) {
		$("#comment_" + obj.target_srl).length &&
			dispCommentList();
	});
	core.insertTrigger("events.voteComment", "before", function (obj) {
		(!recomment && $("#comment_" + obj.target_srl).length) &&
			dispCommentList();
	});
})(this, jQuery);

/* End of file */
