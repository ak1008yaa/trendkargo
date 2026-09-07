function getBlogAdmin() {
  try {
    var stored = localStorage.getItem("trendcargo_blog_posts");
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return (typeof blogPosts !== "undefined") ? blogPosts : [];
}
function escBlog(s) {
  var out = String(s == null ? "" : s);
  out = out.split("&").join("&amp;");
  out = out.split("<").join("&lt;");
  out = out.split(">").join("&gt;");
  out = out.split(String.fromCharCode(34)).join("&quot;");
  out = out.split(String.fromCharCode(39)).join("&#39;");
  return out;
}
function renderBlogAdmin() {
  var host = document.getElementById("blog-admin-list");
  if (!host) return;
  var list = getBlogAdmin();
  if (!list.length) {
    host.innerHTML = "<div class='no-testimonials'>مقاله‌ای وجود ندارد.</div>";
    return;
  }
  var html = "";
  list.forEach(function(p, i) {
    html += "<div class='news-admin-card'>";
    html += "<div class='news-admin-header'><span class='news-id'>مقاله " + (i + 1) + "</span>";
    html += "<div class='news-admin-actions'><button class='btn-reject' onclick='deleteBlogRow(" + i + ")'>حذف</button></div></div>";
    html += "<div class='news-admin-body'>";
    html += "<div class='form-group'><label>عنوان:</label><input type='text' class='form-control blog-f-title' value='" + escBlog(p.title) + "'></div>";
    html += "<div class='form-group'><label>دسته‌بندی:</label><input type='text' class='form-control blog-f-cat' value='" + escBlog(p.category) + "'></div>";
    html += "<div class='form-group'><label>تصویر URL:</label><input type='text' class='form-control blog-f-img' value='" + escBlog(p.img) + "'></div>";
    html += "<div class='form-group'><label>خلاصه:</label><textarea class='form-control blog-f-excerpt' rows='2'>" + escBlog(p.excerpt) + "</textarea></div>";
    html += "<div class='form-group'><label>متن:</label><textarea class='form-control blog-f-body' rows='4'>" + escBlog(p.body.join(" | ")) + "</textarea></div>";
    html += "</div></div>";
  });
  host.innerHTML = html;
}
function addBlogRow() {
  var list = getBlogAdmin();
  list.push({ id: Date.now(), slug: "post-" + Date.now(), category: "عمومی", title: "مقاله جدید", readTime: "3 دقیقه", date: "1405/06/22", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80", excerpt: "خلاصه مقاله", body: ["متن مقاله"] });
  localStorage.setItem("trendcargo_blog_posts", JSON.stringify(list));
  renderBlogAdmin();
}
function deleteBlogRow(i) {
  var list = getBlogAdmin();
  list.splice(i, 1);
  localStorage.setItem("trendcargo_blog_posts", JSON.stringify(list));
  renderBlogAdmin();
}
function saveBlogAdmin() {
  var cards = document.querySelectorAll("#blog-admin-list .news-admin-card");
  var list = getBlogAdmin();
  var out = [];
  cards.forEach(function(card, i) {
    var old = list[i] || {};
    out.push({
      id: old.id || (Date.now() + i),
      slug: old.slug || ("post-" + Date.now() + i),
      category: card.querySelector(".blog-f-cat").value,
      title: card.querySelector(".blog-f-title").value,
      readTime: old.readTime || "4 dagighe",
      date: old.date || "1405/06/22",
      img: card.querySelector(".blog-f-img").value,
      excerpt: card.querySelector(".blog-f-excerpt").value,
      body: card.querySelector(".blog-f-body").value.split(" | ")
    });
  });
  localStorage.setItem("trendcargo_blog_posts", JSON.stringify(out));
  var t = document.getElementById("toast");
  if (t) { t.textContent = "✅ saved"; t.classList.add("show"); setTimeout(function() { t.classList.remove("show"); }, 2500); }
}
function resetBlogDefault() {
  localStorage.removeItem("trendcargo_blog_posts");
  renderBlogAdmin();
}