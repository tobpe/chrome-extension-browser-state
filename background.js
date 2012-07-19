(function() {
  getStates(function(rs) {
    var rows = rs.rows;

    if (rows.hasOwnProperty('length') && rows.length > 0) {
      updateBadge(new String(rows.length));
    }
  });
})();
