(module
  (type $t0 (func (param i32 i32)))
  (type $t1 (func (param i32 i32 i32) (result i32)))
  (type $t2 (func (param i32 i32) (result i32)))
  (type $t3 (func (param f32 f32 f32 f32 f32) (result f32)))
  (import "env" "memory" (memory $env.memory 1))
  (func $f0 (type $t0) (param $p0 i32) (param $p1 i32)
    (local $l2 i32)
    block $B0
      i32.const 0
      i32.load offset=4
      i32.const 16
      i32.sub
      local.tee $l2
      local.get $p0
      i32.store offset=12
      local.get $l2
      local.get $p1
      i32.store offset=8
    end)
  (func $load (type $t1) (param $p0 i32) (param $p1 i32) (param $p2 i32) (result i32)
    (local $l3 i32)
    block $B0 (result i32)
      i32.const 0
      i32.load offset=4
      local.set $l3
      i32.const 0
      local.get $p2
      i32.store offset=12
      local.get $l3
      i32.const 16
      i32.sub
      local.tee $l3
      local.get $p0
      i32.store offset=12
      local.get $l3
      local.get $p1
      i32.store offset=8
      local.get $l3
      local.get $p2
      i32.store offset=4
      i32.const 0
      local.get $l3
      i32.load offset=12
      local.tee $p1
      i32.store offset=16
      local.get $l3
      local.get $p1
      local.get $p2
      i32.const 1
      i32.shl
      i32.add
      i32.store offset=12
      local.get $l3
      i32.const 0
      i32.store
      block $B1
        loop $L2
          local.get $l3
          i32.load
          i32.const 0
          i32.load offset=12
          i32.ge_s
          br_if $B1
          local.get $l3
          i32.load offset=8
          local.get $l3
          i32.load
          local.tee $p2
          i32.const 2
          i32.shl
          i32.add
          i32.const 0
          i32.load offset=16
          local.get $p2
          i32.const 1
          i32.shl
          i32.add
          i32.load16_s
          f32.convert_i32_s
          f32.const 0x1.fffep+15 (;=65535;)
          f32.div
          f32.store
          local.get $l3
          local.get $l3
          i32.load
          i32.const 1
          i32.add
          i32.store
          br $L2
        end
        unreachable
      end
      i32.const 1
    end)
  (func $render (type $t2) (param $p0 i32) (param $p1 i32) (result i32)
    (local $l2 i32) (local $l3 i32) (local $l4 f32)
    block $B0 (result i32)
      i32.const 0
      i32.const 0
      i32.load offset=4
      i32.const 32
      i32.sub
      local.tee $l3
      i32.store offset=4
      local.get $l3
      local.get $p0
      i32.store offset=28
      local.get $l3
      local.get $p1
      i32.store offset=24
      local.get $l3
      local.get $p1
      i32.load offset=8
      local.get $p1
      i32.load offset=4
      i32.sub
      i32.store offset=20
      local.get $l3
      i32.const 0
      i32.store offset=16
      local.get $l3
      local.get $l3
      i32.load offset=24
      i32.load
      i32.store offset=12
      local.get $l3
      local.get $l3
      i32.load offset=24
      i32.load offset=12
      i32.store offset=8
      local.get $l3
      i32.const 0
      i32.store offset=4
      loop $L1 (result i32)
        block $B2
          block $B3
            local.get $l3
            i32.load offset=4
            local.get $l3
            i32.load offset=8
            i32.const -2
            i32.add
            i32.ge_s
            br_if $B3
            local.get $l3
            i32.load offset=28
            local.get $l3
            i32.load offset=4
            i32.const 2
            i32.shl
            i32.add
            i32.const 0
            i32.store
            local.get $l3
            local.get $l3
            f32.load offset=16
            i32.const 0
            i32.load offset=20
            local.get $l3
            i32.load offset=12
            i32.const 2
            i32.shl
            i32.add
            local.tee $p1
            i32.const -4
            i32.add
            f32.load
            local.get $p1
            f32.load
            local.get $p1
            f32.load offset=4
            local.get $p1
            f32.load offset=8
            call $f3
            f32.store
            local.get $l3
            i32.load offset=28
            local.get $l3
            i32.load offset=4
            i32.const 3
            i32.shl
            i32.add
            local.tee $p0
            local.get $l3
            i32.load offset=24
            local.tee $p1
            f32.load offset=20
            i32.const 0
            i32.load offset=20
            local.get $l3
            i32.load offset=12
            i32.const 2
            i32.shl
            local.tee $l2
            i32.add
            f32.load
            f32.mul
            f32.store
            local.get $p0
            i32.const 8
            i32.add
            local.get $p1
            f32.load offset=20
            i32.const 0
            i32.load offset=20
            local.get $l2
            i32.add
            f32.load
            f32.mul
            f32.store
            local.get $l3
            local.get $l3
            f32.load offset=16
            local.get $p1
            f32.load offset=16
            f32.add
            f32.store offset=16
            block $B4
              loop $L5
                local.get $l3
                f32.load offset=16
                local.tee $l4
                f32.const 0x1p+0 (;=1;)
                f32.lt
                local.get $l4
                local.get $l4
                f32.ne
                i32.or
                br_if $B4
                local.get $l3
                local.get $l3
                f32.load offset=16
                f32.const -0x1p+0 (;=-1;)
                f32.add
                f32.store offset=16
                local.get $l3
                local.get $l3
                i32.load offset=12
                i32.const 1
                i32.add
                i32.store offset=12
                br $L5
              end
              unreachable
            end
            loop $L6
              local.get $l3
              i32.load offset=12
              local.get $l3
              i32.load offset=24
              i32.load offset=8
              i32.lt_u
              br_if $B2
              local.get $l3
              local.get $l3
              i32.load offset=12
              local.get $l3
              i32.load offset=20
              i32.sub
              i32.store offset=12
              br $L6
            end
            unreachable
          end
          local.get $l3
          i32.load offset=12
          local.set $p1
          i32.const 0
          local.get $l3
          i32.const 32
          i32.add
          i32.store offset=4
          local.get $p1
          return
        end
        local.get $l3
        local.get $l3
        i32.load offset=4
        i32.const 1
        i32.add
        i32.store offset=4
        br $L1
      end
    end)
  (func $f3 (type $t3) (param $p0 f32) (param $p1 f32) (param $p2 f32) (param $p3 f32) (param $p4 f32) (result f32)
    (local $l5 i32)
    block $B0 (result f32)
      i32.const 0
      i32.load offset=4
      i32.const 48
      i32.sub
      local.tee $l5
      local.get $p0
      f32.store offset=44
      local.get $l5
      local.get $p1
      f32.store offset=40
      local.get $l5
      local.get $p2
      f32.store offset=36
      local.get $l5
      local.get $p3
      f32.store offset=32
      local.get $l5
      local.get $p4
      f32.store offset=28
      local.get $l5
      local.get $l5
      f32.load offset=32
      local.get $l5
      f32.load offset=40
      f32.sub
      f32.const 0x1p-1 (;=0.5;)
      f32.mul
      f32.store offset=24
      local.get $l5
      local.get $l5
      f32.load offset=36
      local.get $l5
      f32.load offset=32
      f32.sub
      local.tee $p4
      f32.store offset=20
      local.get $l5
      local.get $l5
      f32.load offset=24
      local.get $p4
      f32.add
      local.tee $p4
      f32.store offset=16
      local.get $l5
      local.get $p4
      local.get $l5
      f32.load offset=20
      f32.add
      local.get $l5
      f32.load offset=28
      local.get $l5
      f32.load offset=36
      f32.sub
      f32.const 0x1p-1 (;=0.5;)
      f32.mul
      f32.add
      local.tee $p4
      f32.store offset=12
      local.get $l5
      local.get $l5
      f32.load offset=16
      local.get $p4
      f32.add
      local.tee $p3
      f32.store offset=8
      local.get $l5
      f32.load offset=12
      local.get $l5
      f32.load offset=44
      local.tee $p4
      f32.mul
      local.get $p3
      f32.sub
      local.get $p4
      f32.mul
      local.get $l5
      f32.load offset=24
      f32.add
      local.get $p4
      f32.mul
      local.get $l5
      f32.load offset=36
      f32.add
    end)
  (table $T0 0 funcref)
  (export "load" (func $load))
  (export "render" (func $render))
  (data $d0 (i32.const 4) "0'\00\00")
  (data $d1 (i32.const 12) "\00\00\00\00")
  (data $d2 (i32.const 16) "\00\00\00\00")
  (data $d3 (i32.const 20) "\00\00\00\00"))
