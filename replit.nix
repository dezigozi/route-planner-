{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.nodePackages.typescript
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [];
  };
}