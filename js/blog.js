function loadBlogPosts() {
  try {
    var stored = localStorage.getItem("trendcargo_blog_posts");
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return blogPosts;
}
function openArticle(id) {
  var p = loadBlogPosts().find(function(x) { return x.id === id; });
  if (!p) return;
  document.getElementById("blog-list").style.display = "none";
  document.getElementById("article-viewer").style.display = "block";
  var html = "";
  html += "<img src='" + p.img + "' alt='' loading='lazy' style='width:100%;height:260px;object-fit:cover;border-radius:20px;'>";
  html += "<span class='section-badge' style='margin-top:1.2rem;display:inline-block;'>" + p.category + "</span>";
  html += "<h1 style='margin:0.8rem 0;font-size:1.6rem;'>" + p.title + "</h1>";
  html += "<div style='font-size:0.75rem;color:var(--text-muted);opacity:0.7;'>" + p.date + " | " + p.readTime + "</div>";
  p.body.forEach(function(par) {
    html += "<p style='margin-top:1rem;line-height:2;color:var(--text-muted);'>" + par + "</p>";
  });
  document.getElementById("article-content").innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function closeArticle() {
  document.getElementById("article-viewer").style.display = "none";
  document.getElementById("blog-list").style.display = "grid";
}
function renderBlogList() {
  blogPosts = loadBlogPosts();
  var host = document.getElementById("blog-list");
  if (!host) return;
  var html = "";
  loadBlogPosts().forEach(function(p) {
    html += "<article class='blog-card' onclick='openArticle(" + p.id + ")' style='cursor:pointer;background:var(--bg-card);border:1px solid var(--glass-border);border-radius:20px;overflow:hidden;'>";
    html += "<img src='" + p.img + "' alt='' loading='lazy' style='width:100%;height:180px;object-fit:cover;'>";
    html += "<div style='padding:1.2rem;'>";
    html += "<span class='section-badge' style='font-size:0.7rem;padding:0.2rem 0.7rem;'>" + p.category + "</span>";
    html += "<h3 style='margin:0.6rem 0;font-size:1.05rem;'>" + p.title + "</h3>";
    html += "<p style='font-size:0.82rem;color:var(--text-muted);line-height:1.8;'>" + p.excerpt + "</p>";
    html += "<div style='display:flex;gap:1rem;font-size:0.72rem;color:var(--text-muted);margin-top:0.8rem;opacity:0.7;'>" + p.date + "<span>" + p.readTime + "</span></div>";
    html += "</div>";
    html += "</article>";
  });
  host.innerHTML = html;
  host.style.display = "grid";
  host.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
  host.style.gap = "1.5rem";
}
document.addEventListener("DOMContentLoaded", renderBlogList);